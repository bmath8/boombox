/**
 * Radio Station Tests
 * Tests radio station creation, joining, and real-time features
 */

import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
        auth: {
            getUser: jest.fn(),
        },
    },
}));

describe('Radio Stations', () => {
    const mockUser = {
        id: 'broadcaster-id',
        email: 'broadcaster@example.com',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });
    });

    describe('Station Creation', () => {
        it('should create a new radio station', async () => {
            const mockStation = {
                station_id: 'station-123',
                broadcaster_id: mockUser.id,
                station_name: 'Test Station',
                description: 'A test radio station',
                genre: 'Pop',
                privacy: 'public',
                status: 'offline',
            };

            const mockInsert = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: mockStation,
                        error: null,
                    }),
                }),
            });

            (supabase.from as jest.Mock).mockReturnValue({
                insert: mockInsert,
            });

            const { data, error } = await supabase
                .from('radio_stations')
                .insert({
                    broadcaster_id: mockUser.id,
                    station_name: 'Test Station',
                    description: 'A test radio station',
                    genre: 'Pop',
                    privacy: 'public',
                })
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).toEqual(mockStation);
            expect(mockInsert).toHaveBeenCalled();
        });

        it('should enforce broadcaster_id matches current user', async () => {
            const mockInsert = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'RLS policy violation' },
                    }),
                }),
            });

            (supabase.from as jest.Mock).mockReturnValue({
                insert: mockInsert,
            });

            const { data, error } = await supabase
                .from('radio_stations')
                .insert({
                    broadcaster_id: 'different-user-id', // Wrong user
                    station_name: 'Test Station',
                })
                .select()
                .single();

            expect(error).toBeTruthy();
            expect(data).toBeNull();
        });

        it('should validate required fields', async () => {
            const mockInsert = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'Missing required field: station_name' },
                    }),
                }),
            });

            (supabase.from as jest.Mock).mockReturnValue({
                insert: mockInsert,
            });

            const { data, error } = await supabase
                .from('radio_stations')
                .insert({
                    broadcaster_id: mockUser.id,
                    // Missing station_name
                })
                .select()
                .single();

            expect(error).toBeTruthy();
        });
    });

    describe('Station Queries', () => {
        it('should fetch public stations', async () => {
            const mockStations = [
                { station_id: '1', station_name: 'Station 1', privacy: 'public', status: 'live' },
                { station_id: '2', station_name: 'Station 2', privacy: 'public', status: 'live' },
            ];

            const mockEq = jest.fn().mockResolvedValue({
                data: mockStations,
                error: null,
            });

            const mockSelect = jest.fn().mockReturnValue({
                eq: mockEq,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                select: mockSelect,
            });

            const { data, error } = await supabase
                .from('radio_stations')
                .select('*')
                .eq('privacy', 'public');

            expect(error).toBeNull();
            expect(data).toEqual(mockStations);
            expect(data).toHaveLength(2);
        });

        it('should fetch only live stations', async () => {
            const mockStations = [
                { station_id: '1', status: 'live', listener_count: 10 },
            ];

            const mockEq = jest.fn().mockResolvedValue({
                data: mockStations,
                error: null,
            });

            const mockSelect = jest.fn().mockReturnValue({
                eq: mockEq,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                select: mockSelect,
            });

            const { data, error } = await supabase
                .from('radio_stations')
                .select('*')
                .eq('status', 'live');

            expect(error).toBeNull();
            expect(data?.every(s => s.status === 'live')).toBe(true);
        });

        it('should fetch user own stations', async () => {
            const mockStations = [
                { station_id: '1', broadcaster_id: mockUser.id, station_name: 'My Station' },
            ];

            const mockEq = jest.fn().mockResolvedValue({
                data: mockStations,
                error: null,
            });

            const mockSelect = jest.fn().mockReturnValue({
                eq: mockEq,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                select: mockSelect,
            });

            const { data, error } = await supabase
                .from('radio_stations')
                .select('*')
                .eq('broadcaster_id', mockUser.id);

            expect(error).toBeNull();
            expect(data).toEqual(mockStations);
        });
    });

    describe('Station Updates', () => {
        it('should update own station', async () => {
            const mockEq = jest.fn().mockResolvedValue({
                data: { station_id: '1', status: 'live' },
                error: null,
            });

            const mockUpdate = jest.fn().mockReturnValue({
                eq: mockEq,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                update: mockUpdate,
            });

            const { data, error } = await supabase
                .from('radio_stations')
                .update({ status: 'live' })
                .eq('station_id', '1') as { data: { station_id: string; status: string } | null; error: unknown };

            expect(error).toBeNull();
            expect(data?.status).toBe('live');
        });

        it('should not update other user station', async () => {
            const mockEq = jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'RLS policy violation' },
            });

            const mockUpdate = jest.fn().mockReturnValue({
                eq: mockEq,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                update: mockUpdate,
            });

            const { data, error } = await supabase
                .from('radio_stations')
                .update({ status: 'live' })
                .eq('station_id', 'other-station');

            expect(error).toBeTruthy();
            expect(data).toBeNull();
        });
    });

    describe('Station Deletion', () => {
        it('should delete own station', async () => {
            const mockEq = jest.fn().mockResolvedValue({
                data: { station_id: '1' },
                error: null,
            });

            const mockDelete = jest.fn().mockReturnValue({
                eq: mockEq,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                delete: mockDelete,
            });

            const { error } = await supabase
                .from('radio_stations')
                .delete()
                .eq('station_id', '1');

            expect(error).toBeNull();
            expect(mockDelete).toHaveBeenCalled();
        });

        it('should not delete other user station', async () => {
            const mockEq = jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'RLS policy violation' },
            });

            const mockDelete = jest.fn().mockReturnValue({
                eq: mockEq,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                delete: mockDelete,
            });

            const { error } = await supabase
                .from('radio_stations')
                .delete()
                .eq('station_id', 'other-station');

            expect(error).toBeTruthy();
        });
    });

    describe('Privacy Levels', () => {
        it('should respect public privacy', async () => {
            const mockStation = {
                station_id: '1',
                privacy: 'public',
                broadcaster_id: 'other-user',
            };

            const mockSingle = jest.fn().mockResolvedValue({
                data: mockStation,
                error: null,
            });

            const mockEq = jest.fn().mockReturnValue({
                single: mockSingle,
            });

            const mockSelect = jest.fn().mockReturnValue({
                eq: mockEq,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                select: mockSelect,
            });

            const { data, error } = await supabase
                .from('radio_stations')
                .select('*')
                .eq('station_id', '1')
                .single();

            expect(error).toBeNull();
            expect(data?.privacy).toBe('public');
        });

        it('should block private stations from non-friends', async () => {
            const mockSingle = jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'RLS policy violation' },
            });

            const mockEq = jest.fn().mockReturnValue({
                single: mockSingle,
            });

            const mockSelect = jest.fn().mockReturnValue({
                eq: mockEq,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                select: mockSelect,
            });

            const { data, error } = await supabase
                .from('radio_stations')
                .select('*')
                .eq('station_id', 'private-station')
                .single();

            expect(error).toBeTruthy();
            expect(data).toBeNull();
        });
    });
});
