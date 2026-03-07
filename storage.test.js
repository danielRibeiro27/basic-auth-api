import createStorage from './storage.js';
import crypto from 'crypto';

describe('Storage', () => {

    describe('insertUser / getUserByLogin', () => {
        it('should store and retrieve a user by email', () => {
            const storage = createStorage();
            const result = storage.insertUser({ id: '1', email: 'a@b.com', password: 'hash', createdAt: new Date().toISOString() });
            expect(result.success).toBe(true);

            const user = storage.getUserByLogin('a@b.com');
            expect(user).not.toBeNull();
            expect(user.email).toBe('a@b.com');
        });

        it('should reject duplicate email', () => {
            const storage = createStorage();
            storage.insertUser({ id: '1', email: 'a@b.com', password: 'hash', createdAt: new Date().toISOString() });
            const result = storage.insertUser({ id: '2', email: 'a@b.com', password: 'hash2', createdAt: new Date().toISOString() });
            expect(result.success).toBe(false);
        });

        it('should return null for unknown email', () => {
            const storage = createStorage();
            expect(storage.getUserByLogin('unknown@x.com')).toBeNull();
        });
    });

    describe('API keys', () => {
        it('should store API key as hash only (no raw key)', () => {
            const storage = createStorage();
            const rawKey = 'my-secret-key';
            const keyHash = crypto.createHash('sha256').update(rawKey).digest('base64');

            storage.insertApiKey({ id: 'k1', userId: 'u1', keyHash, prefix: rawKey.substring(0, 8), createdAt: new Date().toISOString() });

            const record = storage.getApiKeyByHash(keyHash);
            expect(record).not.toBeNull();
            expect(record.keyHash).toBe(keyHash);
            expect(JSON.stringify(record)).not.toContain(rawKey);
        });

        it('should return null for unknown key hash', () => {
            const storage = createStorage();
            expect(storage.getApiKeyByHash('nonexistent')).toBeNull();
        });

        it('should update last_used_at on use', () => {
            const storage = createStorage();
            const keyHash = 'somehash';
            storage.insertApiKey({ id: 'k1', userId: 'u1', keyHash, prefix: 'abcd', createdAt: new Date().toISOString() });

            expect(storage.getApiKeyByHash(keyHash).lastUsedAt).toBeNull();

            storage.updateLastUsed(keyHash);

            expect(storage.getApiKeyByHash(keyHash).lastUsedAt).not.toBeNull();
        });

        it('should revoke an API key', () => {
            const storage = createStorage();
            const keyHash = 'somehash';
            storage.insertApiKey({ id: 'k1', userId: 'u1', keyHash, prefix: 'abcd', createdAt: new Date().toISOString() });

            expect(storage.getApiKeyByHash(keyHash).revokedAt).toBeNull();

            storage.revokeApiKey(keyHash);

            expect(storage.getApiKeyByHash(keyHash).revokedAt).not.toBeNull();
        });
    });
});
