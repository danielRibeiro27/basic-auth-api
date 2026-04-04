import request from 'supertest';
import { jest } from '@jest/globals';
import createApp from '../src/app.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

describe('POST /login', () => { 

    it('should return 401 when no auth header is provided', async () => {
        const app = createApp();
        await request(app)
            .post('/login')
            //.set('Authentication', 'Basic {base64}') --NO AUTH HEADER
            .expect(401)
            .expect('WWW-Authenticate', 'Basic realm="simple"');
    });

    it('should return 401 when credentials are invalid', async () => {
        const hashedPassword = await bcrypt.hash('correctPassword', 10);
        
        const storageStub = {
            getUserByLoginAsync: jest
                .fn()
                .mockResolvedValue({ id: 'user-id', login: 'user', password: hashedPassword }),
        };

        const app = createApp(storageStub);

        const credentials = Buffer
            .from('user:wrongPassword')
            .toString('base64');

        await request(app)
            .post('/login')
            .set('Authorization', `Basic ${credentials}`)
            .expect(401);
    });

    it('should return 200 with api key when Authorization header is valid', async () => {
        const hashedPassword = await bcrypt.hash('pass', 10); //500-1000ms
        
        const storageStub = {
            getUserByLoginAsync: jest
            .fn()
            .mockResolvedValue({ id: 'user-id', login: 'user', password: hashedPassword }),
            
            createApiKeyAsync: jest
            .fn()
            .mockImplementation((param) => Promise.resolve(param))
        };

        const app = createApp(storageStub);

        const credentials = Buffer
            .from('user:pass')
            .toString('base64');

        const response = await request(app)
            .post('/login')
            .set('Authorization', `Basic ${credentials}`)
            .expect(200);

        expect(response.body).toHaveProperty('apiKey');
        expect(response.body.apiKey).toBeTruthy();
        expect(storageStub.getUserByLoginAsync)
            .toHaveBeenCalledWith('user');
    });
});

describe('sensitive', () => {
    it('request with invalid api key should return 401', async () => {
        const invalidApiKey = 'prefix.invalid_api_key';
        const storageStub = {
            getUnrevokedApiKeyByPrefixedHashedKey: jest.fn().mockResolvedValue(null)
        };

        const app = createApp(storageStub);
        await request(app)
            .get('/sensitive/hello')
            .set('X-Api-Key', invalidApiKey)
            .expect(401);
    });

    it('request with valid api key should return 200', async () => {
        const prefix = 'prefix';
        const randomUUID = crypto.randomUUID();
        const rawApiKey = `${prefix}.${randomUUID}`;
        const storedHashedKey = crypto.createHash('sha256')
                                    .update(randomUUID)
                                    .digest('hex');
        const finalStoredKey = `${prefix}.${storedHashedKey}`;
        const storageStub = {
            getUnrevokedApiKeyByPrefixedHashedKey: jest.fn().mockResolvedValue({ userId: 'user-id', prefixedKeyHash: finalStoredKey}),
            updateApiKeyAsync: jest.fn().mockResolvedValue(null)
        };

        const app = createApp(storageStub);
        await request(app)
            .get('/sensitive/hello')
            .set('X-Api-Key', rawApiKey)
            .expect(200);
    })
});
