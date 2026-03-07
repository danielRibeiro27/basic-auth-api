import request from 'supertest';
import { jest } from '@jest/globals';
import createApp from './app.js';
import bcrypt from 'bcrypt';

//===login
describe('POST /login', () => { 

    it('should return 401 when no auth header is provided', async () => {
        const app = createApp();
        await request(app)
            .post('/login')
            //.set('Authentication', 'Basic {base64}') --NO AUTH HEADER
            .expect(401)
            .expect('WWW-Authenticate', 'Basic realm="simple"');
    });

    it.todo('should return 401 when credentials are invalid');
    it.todo('should return 400 when authorization header is malformed');

    it('should return 200 with api key when Authorization header is valid', async () => {
        const hashedPassword = await bcrypt.hash('pass', 10); //500-1000ms
        
        const storageStub = {
            getUserByLogin: jest
            .fn()
            .mockResolvedValue({ id: 'user-id', login: 'user', password: hashedPassword }),
            
            insertHashedApiKey: jest
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
        });
});

//===protected
//request with no api key should return 401
//request with invalid api key should return 401
//request with revoked api key should return 401
//request with valid key should return 200 and req.auth.userId

//===persistance
//storage user.email should be unique
//storage api key should only has hash
//storage shoudl update last_used_at on use

//===security
//http should be redirected to https