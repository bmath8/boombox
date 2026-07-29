import { isServerMessage, isRadioMessage, isFeedMessage, isErrorMessage } from '../types/websocket';

describe('WebSocket Type Guards', () => {
    describe('isServerMessage', () => {
        it('should return true for valid server message', () => {
            const msg = { type: 'connected', timestamp: 1234567890 };
            expect(isServerMessage(msg)).toBe(true);
        });

        it('should return false for null', () => {
            expect(isServerMessage(null)).toBe(false);
        });

        it('should return false for missing type', () => {
            const msg = { timestamp: 1234567890 };
            expect(isServerMessage(msg)).toBe(false);
        });

        it('should return false for missing timestamp', () => {
            const msg = { type: 'connected' };
            expect(isServerMessage(msg)).toBe(false);
        });
    });

    describe('isRadioMessage', () => {
        it('should return true for radio messages', () => {
            const msg = { type: 'radio:joined', timestamp: 123, stationId: '1' };
            // @ts-ignore
            expect(isRadioMessage(msg)).toBe(true);
        });

        it('should return false for non-radio messages', () => {
            const msg = { type: 'connected', timestamp: 123, userId: '1' };
            // @ts-ignore
            expect(isRadioMessage(msg)).toBe(false);
        });
    });

    describe('isFeedMessage', () => {
        it('should return true for feed messages', () => {
            const msg = { type: 'feed:new-activity', timestamp: 123, userId: '1', activity: {} };
            // @ts-ignore
            expect(isFeedMessage(msg)).toBe(true);
        });

        it('should return false for non-feed messages', () => {
            const msg = { type: 'connected', timestamp: 123, userId: '1' };
            // @ts-ignore
            expect(isFeedMessage(msg)).toBe(false);
        });
    });

    describe('isErrorMessage', () => {
        it('should return true for error messages', () => {
            const msg = { type: 'error', timestamp: 123, message: 'fail' };
            // @ts-ignore
            expect(isErrorMessage(msg)).toBe(true);
        });

        it('should return false for non-error messages', () => {
            const msg = { type: 'connected', timestamp: 123, userId: '1' };
            // @ts-ignore
            expect(isErrorMessage(msg)).toBe(false);
        });
    });
});
