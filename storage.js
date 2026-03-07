export default function createStorage() {
  const users = new Map();
  const usersByEmail = new Map();
  const apiKeys = new Map();

  return {
    insertUser({ id, email, password, createdAt }) {
      if (usersByEmail.has(email)) {
        return { success: false, error: 'email_taken' };
      }
      const user = { id, email, password, createdAt };
      users.set(id, user);
      usersByEmail.set(email, user);
      return { success: true };
    },

    getUserByLogin(email) {
      return usersByEmail.get(email) || null;
    },

    insertApiKey({ id, userId, keyHash, prefix, createdAt }) {
      const record = { id, userId, keyHash, prefix, createdAt, revokedAt: null, lastUsedAt: null };
      apiKeys.set(keyHash, record);
      return { success: true };
    },

    getApiKeyByHash(keyHash) {
      return apiKeys.get(keyHash) || null;
    },

    revokeApiKey(keyHash) {
      const record = apiKeys.get(keyHash);
      if (!record) return { success: false };
      record.revokedAt = new Date().toISOString();
      return { success: true };
    },

    updateLastUsed(keyHash) {
      const record = apiKeys.get(keyHash);
      if (!record) return;
      record.lastUsedAt = new Date().toISOString();
    }
  };
}
