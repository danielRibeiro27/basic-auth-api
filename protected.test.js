import request from 'supertest';
import { jest } from '@jest/globals';
import createApp from './app.js';
import crypto from 'crypto';

function makeStorageStub(keyRecord) {
    return {
        getUserByLogin: jest.fn(),
        insertApiKey: jest.fn().mockResolvedValue({ success: true }),
        getApiKeyByHash: jest.fn().mockResolvedValue(keyRecord),
        revokeApiKey: jest.fn().mockResolvedValue({ success: true }),
        updateLastUsed: jest.fn().mockResolvedValue({ success: true }),
        insertUser: jest.fn().mockResolvedValue({ success: true }),
    };
}

describe('GET /sensitive', () => {

    it('should return 401 when no X-API-Key header is provided', async () => {
        const storage = makeStorageStub(null);
        const app = createApp(storage);

        await request(app).get('/sensitive').expect(401);
    });

    it('should return 401 for an invalid (unknown) API key', async () => {
        const storage = makeStorageStub(null);
        const app = createApp(storage);

        await request(app)
            .get('/sensitive')
            .set('X-API-Key', 'unknown-key')
            .expect(401);
    });

    it('should return 401 for a revoked API key', async () => {
        const revokedRecord = { userId: 'user-1', revoked_at: '2024-01-01T00:00:00.000Z', keyHash: 'hash' };
        const storage = makeStorageStub(revokedRecord);
        const app = createApp(storage);

        await request(app)
            .get('/sensitive')
            .set('X-API-Key', 'some-raw-key')
            .expect(401);
    });

    it('should return 200 and correct userId for a valid API key', async () => {
        const userId = 'user-123';
        const rawKey = 'valid-raw-key';
        const hash = crypto.createHash('sha256').update(rawKey).digest('base64');
        const validRecord = { userId, keyHash: hash, revoked_at: null };
        const storage = makeStorageStub(validRecord);
        const app = createApp(storage);

        const response = await request(app)
            .get('/sensitive')
            .set('X-API-Key', rawKey)
            .expect(200);

        expect(response.body.userId).toBe(userId);
    });

    it('should call storage.updateLastUsed on a valid request', async () => {
        const rawKey = 'valid-raw-key';
        const hash = crypto.createHash('sha256').update(rawKey).digest('base64');
        const validRecord = { userId: 'user-1', keyHash: hash, revoked_at: null };
        const storage = makeStorageStub(validRecord);
        const app = createApp(storage);

        await request(app)
            .get('/sensitive')
            .set('X-API-Key', rawKey)
            .expect(200);

        expect(storage.updateLastUsed).toHaveBeenCalledWith(hash);
    });
});
