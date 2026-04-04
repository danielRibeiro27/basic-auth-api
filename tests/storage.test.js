import { beforeAll, expect, jest } from '@jest/globals';
import createStorage from '../src/storage.js';
import crypto from 'crypto';

beforeAll(() => {
    global.storage = createStorage();
});

describe('users', () => {
    it('should create and get that user', async function(){
        //arrange
        const user = {login: 'user', password: 'pass'};

        //act
        const createdUser = await global.storage.createUserAsync(user);

        //assert
        expect(createdUser).toHaveProperty('id');
        expect(createdUser.id).toBeTruthy();
        expect(createdUser).toHaveProperty('createdAt');
        expect(createdUser.createdAt).toBeTruthy();
        expect(createdUser).toHaveProperty('login', user.login);

        const retrievedUser = await global.storage.getUserByLoginAsync(user.login);
        expect(retrievedUser).toEqual(createdUser);
    });
});

describe('api keys',  () => {
    it('should create and get an api key by id', async function(){
        //isn't necessary to hash the key in the test, 
        //and neither to check if the returned key is different from the original unhashed key
        //to-do: refactor to remove this logic from test and place it in the domain
        let originalUnhashedKey = crypto.randomUUID();
        let prefix = 'prefix'
        let hashedKey = crypto.createHash('sha256') //hash class instance
                            .update(originalUnhashedKey) //push the data to be hashed
                            .digest('hex'); //calculate final hash and return it as hex string

        let prefixPlusHashedKey = `${prefix}.${hashedKey}`;
        
        //arrange
        const newApiKey = {
            userId: crypto.randomUUID(),
            prefixedKeyHash: prefixPlusHashedKey, 
            prefix: prefix,
            createdAt: new Date(),
            revokedAt: null,
            lastUsedAt: null
        }

        //act
        const apiKey = await global.storage.createApiKeyAsync(newApiKey);

        //assert
        expect(apiKey).toHaveProperty('prefixedKeyHash');
        expect(apiKey.prefixedKeyHash).toBeTruthy();
        expect(apiKey).toHaveProperty('createdAt');
        expect(apiKey.createdAt).toBeTruthy();
        expect(apiKey).toHaveProperty('revokedAt');
        expect(apiKey.revokedAt).toBeNull();
        expect(apiKey).toHaveProperty('lastUsedAt');
        expect(apiKey.lastUsedAt).toBeNull();
        expect(apiKey.prefixedKeyHash).not.toBe(originalUnhashedKey);

        const retrievedApiKey = await global.storage.getUnrevokedApiKeyByPrefixedHashedKey(apiKey.prefixedKeyHash);
        expect(retrievedApiKey).toEqual(apiKey);
    });

    it('should revoke an api key', async function(){
        //arrange
        const apiKey = {
            id: crypto.randomUUID(),
            userId: crypto.randomUUID(),
            prefixedKeyHash: crypto.randomUUID(), 
            prefix: 'prefix',
            createdAt: new Date(),
            revokedAt: null,
            lastUsedAt: null
        }

        const createdApiKey = await global.storage.createApiKeyAsync(apiKey);

        expect(createdApiKey).toHaveProperty('revokedAt');
        expect(createdApiKey.revokedAt).toBeNull();

        createdApiKey.revokedAt = new Date();

        let updatedApiKey = await global.storage.updateApiKeyAsync(createdApiKey);
        expect(updatedApiKey).toHaveProperty('revokedAt');
        expect(updatedApiKey.revokedAt).toBeTruthy();
    });
});