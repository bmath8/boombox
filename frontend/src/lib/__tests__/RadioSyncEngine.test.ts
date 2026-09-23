/**
 * RadioSyncEngine Tests
 * Tests client-side latency compensation and playback synchronization
 */

import { RadioSyncEngine } from '../RadioSyncEngine';
import { logger } from '../logger';
import type { SpotifyPlayer } from '../types';

// Mock dependencies
jest.mock('../logger', () => ({
    logger: {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
    },
}));

global.fetch = jest.fn();

describe('RadioSyncEngine', () => {
    let mockPlayer: jest.Mocked<SpotifyPlayer>;
    let engine: RadioSyncEngine;
    const stationId = 'test-station-123';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        // Mock Spotify player
        mockPlayer = {
            getCurrentState: jest.fn(),
            seek: jest.fn(),
            pause: jest.fn(),
            resume: jest.fn(),
            togglePlay: jest.fn(),
            nextTrack: jest.fn(),
            previousTrack: jest.fn(),
            setVolume: jest.fn(),
            getVolume: jest.fn(),
            addListener: jest.fn(),
            removeListener: jest.fn(),
            connect: jest.fn(),
            disconnect: jest.fn(),
        } as unknown as jest.Mocked<SpotifyPlayer>;

        engine = new RadioSyncEngine(stationId, mockPlayer);
    });

    afterEach(() => {
        jest.useRealTimers();
        engine.stopSyncMonitoring();
    });

    describe('Time Calibration', () => {
        it('should calibrate server time with multiple samples', async () => {
            const serverTime = 1000000;
            (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ timestamp: serverTime }),
            });

            const calibrationPromise = engine.calibrateServerTime();

            // Fast-forward through the 100ms delays between samples
            for (let i = 0; i < 5; i++) {
                // Flush the fetch/json microtasks and the 100ms sleep for each sample
                await jest.advanceTimersByTimeAsync(100);
            }

            await calibrationPromise;

            expect(global.fetch).toHaveBeenCalledTimes(5);
            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Time calibrated'));
        });

        it('should use median offset to filter outliers', async () => {
            const offsets = [100, 105, 102, 500, 103]; // 500 is outlier
            let callCount = 0;

            (global.fetch as jest.Mock).mockImplementation(async () => {
                const offset = offsets[callCount++]!;
                return {
                    json: async () => ({ timestamp: Date.now() + offset }),
                };
            });

            const calibrationPromise = engine.calibrateServerTime();

            for (let i = 0; i < 5; i++) {
                // Flush the fetch/json microtasks and the 100ms sleep for each sample
                await jest.advanceTimersByTimeAsync(100);
            }

            await calibrationPromise;

            // Median of [100, 102, 103, 105, 500] should be 103
            const serverTime = engine.getServerTime();
            expect(serverTime).toBeGreaterThan(Date.now());
        });

        it('should fetch server time from API', async () => {
            const timestamp = 1234567890;
            (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ timestamp }),
            });

            const result = await engine.fetchServerTime();

            expect(global.fetch).toHaveBeenCalledWith('/api/time');
            expect(result).toBe(timestamp);
        });
    });

    describe('Position Synchronization', () => {
        beforeEach(async () => {
            // Pre-calibrate for sync tests
            (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ timestamp: Date.now() }),
            });

            const calibrationPromise = engine.calibrateServerTime();
            for (let i = 0; i < 5; i++) {
                // Flush the fetch/json microtasks and the 100ms sleep for each sample
                await jest.advanceTimersByTimeAsync(100);
            }
            await calibrationPromise;

            jest.clearAllMocks();
        });

        it('should sync to broadcaster position when drift exceeds 500ms', async () => {
            const trackId = 'track-123';
            const positionMs = 10000;
            const serverTimestamp = Date.now();

            mockPlayer.getCurrentState.mockResolvedValue({
                position: 9000, // 1000ms behind
                paused: false,
                track_window: {
                    current_track: { id: trackId, name: 'Test Track' },
                },
            } as any);

            await engine.syncToPosition(trackId, positionMs, serverTimestamp);

            expect(mockPlayer.seek).toHaveBeenCalled();
            expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Syncing'));
        });

        it('should not sync when drift is less than 500ms', async () => {
            const trackId = 'track-123';
            const positionMs = 10000;
            const serverTimestamp = Date.now();

            mockPlayer.getCurrentState.mockResolvedValue({
                position: 10200, // Only 200ms ahead
                paused: false,
                track_window: {
                    current_track: { id: trackId, name: 'Test Track' },
                },
            } as any);

            await engine.syncToPosition(trackId, positionMs, serverTimestamp);

            expect(mockPlayer.seek).not.toHaveBeenCalled();
        });

        it('should switch tracks when playing wrong track', async () => {
            const correctTrackId = 'track-123';
            const wrongTrackId = 'track-456';
            const positionMs = 10000;
            const serverTimestamp = Date.now();

            mockPlayer.getCurrentState.mockResolvedValue({
                position: 10000,
                paused: false,
                track_window: {
                    current_track: { id: wrongTrackId, name: 'Wrong Track' },
                },
            } as any);

            (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

            await engine.syncToPosition(correctTrackId, positionMs, serverTimestamp);

            expect(global.fetch).toHaveBeenCalledWith(
                '/api/spotify/play',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining(correctTrackId),
                })
            );
        });

        it('should handle player not ready gracefully', async () => {
            mockPlayer.getCurrentState.mockResolvedValue(null);

            await engine.syncToPosition('track-123', 10000, Date.now());

            expect(mockPlayer.seek).not.toHaveBeenCalled();
        });
    });

    describe('Track Playback', () => {
        it('should play track at specified position', async () => {
            const trackId = 'track-123';
            const positionMs = 5000;

            (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

            await engine.playTrack(trackId, positionMs);

            expect(global.fetch).toHaveBeenCalledWith(
                '/api/spotify/play',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uris: [`spotify:track:${trackId}`],
                        position_ms: positionMs,
                    }),
                })
            );
        });

        it('should play track from beginning when position not specified', async () => {
            const trackId = 'track-123';

            (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

            await engine.playTrack(trackId);

            expect(global.fetch).toHaveBeenCalledWith(
                '/api/spotify/play',
                expect.objectContaining({
                    body: expect.stringContaining('"position_ms":0'),
                })
            );
        });
    });

    describe('Sync Monitoring', () => {
        it('should start sync monitoring interval', () => {
            const mockWs = {
                send: jest.fn(),
                readyState: WebSocket.OPEN,
            };
            (window as any).ws = mockWs;

            engine.startSyncMonitoring();

            jest.advanceTimersByTime(5000);

            expect(mockWs.send).toHaveBeenCalledWith(
                expect.stringContaining('radio:request-position')
            );
        });

        it('should stop sync monitoring', () => {
            engine.startSyncMonitoring();
            engine.stopSyncMonitoring();

            const mockWs = {
                send: jest.fn(),
                readyState: WebSocket.OPEN,
            };
            (window as any).ws = mockWs;

            jest.advanceTimersByTime(10000);

            expect(mockWs.send).not.toHaveBeenCalled();
        });

        it('should request position updates via WebSocket', () => {
            const mockWs = {
                send: jest.fn(),
                readyState: WebSocket.OPEN,
            };
            (window as any).ws = mockWs;

            engine.requestPositionUpdate();

            expect(mockWs.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'radio:request-position',
                    stationId,
                })
            );
        });

        it('should not send request when WebSocket is not open', () => {
            const mockWs = {
                send: jest.fn(),
                readyState: WebSocket.CONNECTING,
            };
            (window as any).ws = mockWs;

            engine.requestPositionUpdate();

            expect(mockWs.send).not.toHaveBeenCalled();
        });
    });

    describe('Event Handlers', () => {
        it('should handle position update from broadcaster', async () => {
            const data = {
                trackId: 'track-123',
                positionMs: 10000,
                timestamp: Date.now(),
            };

            mockPlayer.getCurrentState.mockResolvedValue({
                position: 10000,
                paused: false,
                track_window: {
                    current_track: { id: data.trackId, name: 'Test' },
                },
            } as any);

            (global.fetch as jest.Mock).mockResolvedValue({
                json: async () => ({ timestamp: Date.now() }),
            });

            // Uncalibrated engine calibrates first (5 samples x 100ms sleep under fake timers)
            const updatePromise = engine.handlePositionUpdate(data);
            await jest.advanceTimersByTimeAsync(600);
            await updatePromise;

            expect(mockPlayer.getCurrentState).toHaveBeenCalled();
        });

        it('should handle track change from broadcaster', async () => {
            const data = {
                track: {
                    id: 'new-track-123',
                    name: 'New Track',
                },
            };

            (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

            await engine.handleTrackChange(data);

            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('New Track')
            );
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/spotify/play',
                expect.objectContaining({
                    body: expect.stringContaining(data.track.id),
                })
            );
        });
    });

    describe('Sync Quality Metrics', () => {
        it('should return sync quality metrics', async () => {
            const mockState = {
                position: 10000,
                paused: false,
                track_window: {
                    current_track: { id: 'track-123', name: 'Test' },
                },
            };

            mockPlayer.getCurrentState.mockResolvedValue(mockState as any);

            const quality = await engine.getSyncQuality();

            expect(quality).toEqual({
                isCalibrated: expect.any(Boolean),
                serverTimeOffset: expect.any(Number),
                currentPosition: 10000,
                isPlaying: true,
                trackId: 'track-123',
            });
        });

        it('should return null when player state unavailable', async () => {
            mockPlayer.getCurrentState.mockResolvedValue(null);

            const quality = await engine.getSyncQuality();

            expect(quality).toBeNull();
        });
    });
});
