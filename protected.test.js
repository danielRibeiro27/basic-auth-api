import request from 'supertest';
import { jest } from '@jest/globals';
import createApp from './app.js';
import crypto from 'crypto';

describe('GET /sensitive', () => {

    function buildStorage(overrides = {}) {
        return {
            getApiKeyByHash: jest.fn().mockResolvedValue(null),
            updateLastUsed: jest.fn().mockResolvedValue(undefined),
            ...overrides,
        };
    }

    it('should return 401 when no X-API-Key header is provided', async () => {
        const app = createApp(buildStorage());
        await request(app)
            .get('/sensitive')
            .expect(401);
    });

    it('should return 401 when API key is invalid', async () => {
        const app = createApp(buildStorage());
        await request(app)
            .get('/sensitive')
            .set('X-API-Key', 'invalid-key')
            .expect(401);
    });

    it('should return 401 when API key is revoked', async () => {
        const rawKey = 'test-api-key-revoked';
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('base64');

        const storage = buildStorage({
            getApiKeyByHash: jest.fn().mockResolvedValue({
                userId: 'user-id',
                keyHash,
                revokedAt: '2025-01-01T00:00:00.000Z',
            }),
        });

        const app = createApp(storage);
        await request(app)
            .get('/sensitive')
            .set('X-API-Key', rawKey)
            .expect(401);
    });

    it('should return 200 with userId when API key is valid', async () => {
        const rawKey = 'test-api-key-valid';
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('base64');

        const storage = buildStorage({
            getApiKeyByHash: jest.fn().mockResolvedValue({
                userId: 'user-42',
                keyHash,
                revokedAt: null,
            }),
        });

        const app = createApp(storage);
        const response = await request(app)
            .get('/sensitive')
            .set('X-API-Key', rawKey)
            .expect(200);

        expect(response.body.userId).toBe('user-42');
        expect(response.body.message).toBeTruthy();
        expect(storage.updateLastUsed).toHaveBeenCalledWith(keyHash);
    });
});

describe('POST /api-keys/revoke', () => {

    it('should return 401 when no X-API-Key header is provided', async () => {
        const storage = {
            getApiKeyByHash: jest.fn().mockResolvedValue(null),
            updateLastUsed: jest.fn(),
        };
        const app = createApp(storage);
        await request(app)
            .post('/api-keys/revoke')
            .expect(401);
    });

    it('should revoke key and return 200', async () => {
        const rawKey = 'test-api-key-to-revoke';
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('base64');

        const storage = {
            getApiKeyByHash: jest.fn().mockResolvedValue({
                userId: 'user-id',
                keyHash,
                revokedAt: null,
            }),
            updateLastUsed: jest.fn(),
            revokeApiKey: jest.fn().mockResolvedValue({ success: true }),
        };

        const app = createApp(storage);
        const response = await request(app)
            .post('/api-keys/revoke')
            .set('X-API-Key', rawKey)
            .expect(200);

        expect(response.body.message).toBeTruthy();
        expect(storage.revokeApiKey).toHaveBeenCalledWith(keyHash);
    });
});
