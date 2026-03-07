import { createStorage } from './storage.js';

describe('createStorage', () => {

    describe('insertUser / getUserByLogin', () => {

        it('should insert a user and retrieve them by email', () => {
            const storage = createStorage();
            const user = { id: 'u1', email: 'alice@example.com', password: 'hash', createdAt: '2024-01-01T00:00:00.000Z' };
            expect(storage.insertUser(user).success).toBe(true);
            expect(storage.getUserByLogin('alice@example.com')).toMatchObject({ id: 'u1', email: 'alice@example.com' });
        });

        it('should enforce unique email (duplicate insert fails)', () => {
            const storage = createStorage();
            const user = { id: 'u1', email: 'dup@example.com', password: 'hash', createdAt: '2024-01-01T00:00:00.000Z' };
            expect(storage.insertUser(user).success).toBe(true);
            expect(storage.insertUser({ ...user, id: 'u2' }).success).toBe(false);
        });

        it('should return null for unknown email', () => {
            const storage = createStorage();
            expect(storage.getUserByLogin('nobody@example.com')).toBeNull();
        });
    });

    describe('insertApiKey / getApiKeyByHash', () => {

        it('should store an API key and retrieve it by hash', () => {
            const storage = createStorage();
            const record = { id: 'k1', userId: 'u1', keyHash: 'sha256hash', prefix: 'prefix12', createdAt: '2024-01-01T00:00:00.000Z' };
            expect(storage.insertApiKey(record).success).toBe(true);
            const stored = storage.getApiKeyByHash('sha256hash');
            expect(stored).not.toBeNull();
            expect(stored.keyHash).toBe('sha256hash');
        });

        it('should store only the hash — rawKey must not be present', () => {
            const storage = createStorage();
            storage.insertApiKey({ id: 'k1', userId: 'u1', keyHash: 'hashonly', prefix: 'prefix12', createdAt: '2024-01-01T00:00:00.000Z' });
            const stored = storage.getApiKeyByHash('hashonly');
            expect(stored.rawKey).toBeUndefined();
        });

        it('should return null for unknown hash', () => {
            const storage = createStorage();
            expect(storage.getApiKeyByHash('nope')).toBeNull();
        });
    });

    describe('revokeApiKey', () => {

        it('should set revoked_at on the key', () => {
            const storage = createStorage();
            storage.insertApiKey({ id: 'k1', userId: 'u1', keyHash: 'revokeme', prefix: 'prefix12', createdAt: '2024-01-01T00:00:00.000Z' });
            expect(storage.getApiKeyByHash('revokeme').revoked_at).toBeNull();
            expect(storage.revokeApiKey('revokeme').success).toBe(true);
            expect(storage.getApiKeyByHash('revokeme').revoked_at).not.toBeNull();
        });

        it('should fail gracefully for unknown hash', () => {
            const storage = createStorage();
            expect(storage.revokeApiKey('unknown').success).toBe(false);
        });
    });

    describe('updateLastUsed', () => {

        it('should update last_used_at after a valid key lookup', () => {
            const storage = createStorage();
            storage.insertApiKey({ id: 'k1', userId: 'u1', keyHash: 'lasthash', prefix: 'prefix12', createdAt: '2024-01-01T00:00:00.000Z' });
            expect(storage.getApiKeyByHash('lasthash').last_used_at).toBeNull();
            expect(storage.updateLastUsed('lasthash').success).toBe(true);
            expect(storage.getApiKeyByHash('lasthash').last_used_at).not.toBeNull();
        });

        it('should fail gracefully for unknown hash', () => {
            const storage = createStorage();
            expect(storage.updateLastUsed('unknown').success).toBe(false);
        });
    });
});
