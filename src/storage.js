export default function createStorage() {
    const users = new Map(); //in-memory map (better than object)
    const apiKeys = new Map(); //in-memory map (better than object)

    async function createUserAsync(user){
        const userToBeCreated = {
            id: crypto.randomUUID(),
            login: user.login,
            password: user.password,
            createdAt: new Date()
        }

        users.set(user.login, userToBeCreated);

        return userToBeCreated
    }

    async function getUserByLoginAsync(login){
        return users.get(login);
    }

    async function createApiKeyAsync(apiKey){
        let apiKeyToBeCreated = {
            id: crypto.randomUUID(),
            userId: apiKey.userId,
            prefixedKeyHash: apiKey.prefixedKeyHash,
            prefix: apiKey.prefix,
            createdAt: apiKey.createdAt,
            revokedAt: apiKey.revokedAt,
            lastUsedAt: apiKey.lastUsedAt
        }
        apiKeys.set(apiKeyToBeCreated.id, apiKeyToBeCreated);

        return apiKeyToBeCreated;        
    }

    async function getApiKeyByIdAsync(id){
        return apiKeys.get(id);
    }

    async function getUnrevokedApiKeyByPrefixedHashedKey(prefixedHashedKey){
        for (const apiKey of apiKeys.values()) {
            if(apiKey.prefixedKeyHash === prefixedHashedKey && apiKey.revokedAt === null){
                return apiKey;
            }
        }
        return null;
    }

    async function updateApiKeyAsync(apiKey){
        if(!apiKeys.has(apiKey.id)){
            throw new Error('Api key not found');
        }
        apiKeys.set(apiKey.id, apiKey);
        return apiKey;
    }

    return {createUserAsync, getUserByLoginAsync, createApiKeyAsync, getUnrevokedApiKeyByPrefixedHashedKey, updateApiKeyAsync};
};