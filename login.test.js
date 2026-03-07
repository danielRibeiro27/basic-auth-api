import request from 'supertest';
import { jest } from '@jest/globals';
import createApp from './app.js';
import bcrypt from 'bcrypt';

describe('POST /login', () => { 

    it('should return 401 when no auth header is provided', async () => {
        const app = createApp({});
        await request(app)
            .post('/login')
            .expect(401)
            .expect('WWW-Authenticate', 'Basic realm="simple"');
    });

    it('should return 401 when credentials are invalid', async () => {
        const hashedPassword = await bcrypt.hash('correctpass', 10);

        const storageStub = {
            getUserByLogin: jest
            .fn()
            .mockResolvedValue({ id: 'user-id', email: 'user', password: hashedPassword }),
        };

        const app = createApp(storageStub);

        const credentials = Buffer
            .from('user:wrongpass')
            .toString('base64');

        await request(app)
            .post('/login')
            .set('Authorization', `Basic ${credentials}`)
            .expect(401);
    });

    it('should return 400 when authorization header is malformed', async () => {
        const app = createApp({});

        await request(app)
            .post('/login')
            .set('Authorization', 'Basic !!invalid!!')
            .expect(400);
    });

    it('should return 200 with api key when Authorization header is valid', async () => {
        const hashedPassword = await bcrypt.hash('pass', 10);
        
        const storageStub = {
            getUserByLogin: jest
            .fn()
            .mockResolvedValue({ id: 'user-id', email: 'user', password: hashedPassword }),
            insertApiKey: jest
            .fn()
            .mockResolvedValue({success:true})
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
        expect(storageStub.getUserByLogin)
            .toHaveBeenCalledWith('user');
        expect(storageStub.insertApiKey).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'user-id',
                prefix: expect.any(String),
            })
        );
    });
});