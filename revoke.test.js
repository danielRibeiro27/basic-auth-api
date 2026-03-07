import request from 'supertest';
import createApp from './app.js';
import { createStorage } from './storage.js';
import bcrypt from 'bcrypt';

describe('Revocation flow (integration)', () => {

    it('create user → login → access sensitive → revoke → retry returns 401', async () => {
        const storage = createStorage();
        const app = createApp(storage);

        // 1. Create user
        const createRes = await request(app)
            .post('/users')
            .send({ email: 'flow@example.com', password: 'mypassword' })
            .expect(201);

        expect(createRes.body.email).toBe('flow@example.com');

        // 2. Login to obtain an API key
        const credentials = Buffer.from('flow@example.com:mypassword').toString('base64');
        const loginRes = await request(app)
            .post('/login')
            .set('Authorization', `Basic ${credentials}`)
            .expect(200);

        const apiKey = loginRes.body.apiKey;
        expect(apiKey).toBeTruthy();

        // 3. Access protected endpoint with the API key
        await request(app)
            .get('/sensitive')
            .set('X-API-Key', apiKey)
            .expect(200);

        // 4. Revoke the API key
        await request(app)
            .post('/api-keys/revoke')
            .set('X-API-Key', apiKey)
            .expect(200);

        // 5. Retry protected endpoint — should now be 401
        await request(app)
            .get('/sensitive')
            .set('X-API-Key', apiKey)
            .expect(401);
    });
});
