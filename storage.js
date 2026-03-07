import { randomUUID } from 'crypto';

export function createStorage() {
  const users = new Map(); // email -> user record
  const apiKeys = new Map(); // keyHash -> api key record

  return {
    insertUser({ id, email, password, createdAt }) {
      if (users.has(email)) {
        return { success: false, error: 'Email already exists' };
      }
      users.set(email, { id, email, password, createdAt });
      return { success: true };
    },

    getUserByLogin(email) {
      return users.get(email) ?? null;
    },

    insertApiKey({ id, userId, keyHash, prefix, createdAt }) {
      if (apiKeys.has(keyHash)) {
        return { success: false, error: 'Key already exists' };
      }
      apiKeys.set(keyHash, {
        id: id ?? randomUUID(),
        userId,
        keyHash,
        prefix,
        createdAt,
        revoked_at: null,
        last_used_at: null,
      });
      return { success: true };
    },

    getApiKeyByHash(keyHash) {
      return apiKeys.get(keyHash) ?? null;
    },

    revokeApiKey(keyHash) {
      const record = apiKeys.get(keyHash);
      if (!record) {
        return { success: false, error: 'Key not found' };
      }
      record.revoked_at = new Date().toISOString();
      return { success: true };
    },

    updateLastUsed(keyHash) {
      const record = apiKeys.get(keyHash);
      if (!record) {
        return { success: false, error: 'Key not found' };
      }
      record.last_used_at = new Date().toISOString();
      return { success: true };
    },
  };
}
