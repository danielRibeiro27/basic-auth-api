import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export default function createApp(storage){

  const app = express();
  app.use(express.json());

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  app.post('/login', async (req, res) =>{
    if(req.headers['authorization'] === undefined){
      res.set('WWW-Authenticate', 'Basic realm="simple"');
      return res.status(401).send('Unauthorized');
    }

    if(!req.headers['authorization'].startsWith('Basic ')){
      return res.status(400).send('Bad Request');
    }

    const credentials = decodeCredentials(req.headers.authorization);
    if(!credentials){
      return res.status(400).send('Bad Request');
    }

    const user = await storage.getUserByLogin(credentials.login);

    if(!user || !(await bcrypt.compare(credentials.password, user.password))){
      return res.status(401).send('Unauthorized');
    }

    const rawApiKey = generateRawApiKey();
    const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('base64');
    const prefix = rawApiKey.substring(0, 8);
    const id = crypto.randomUUID();

    await storage.insertApiKey({ id, userId: user.id, keyHash, prefix, createdAt: new Date().toISOString() });

    res.status(200).send({apiKey: rawApiKey});
  });

  app.post('/users', async (req, res) => {
    const { email, password } = req.body || {};
    if(!email || !password){
      return res.status(400).send('Bad Request');
    }

    const id = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await storage.insertUser({ id, email, password: hashedPassword, createdAt: new Date().toISOString() });

    if(!result.success){
      return res.status(409).send('Conflict');
    }

    res.status(201).send({ id, email });
  });

  app.get('/sensitive', authenticateApiKey, (req, res) =>{
    res.status(200).send({ userId: req.auth.userId, message: "Here's your sensitive data." });
  });

  app.post('/api-keys/revoke', authenticateApiKey, async (req, res) =>{
    await storage.revokeApiKey(req.auth.keyHash);
    res.status(200).send({ message: 'API key revoked.' });
  });

  async function authenticateApiKey(req, res, next){
    const apiKey = req.headers['x-api-key'];
    if(!apiKey){
      return res.status(401).send('Unauthorized');
    }

    const keyHash = crypto.createHash('sha256').update(apiKey).digest('base64');
    const record = await storage.getApiKeyByHash(keyHash);

    if(!record || record.revokedAt){
      return res.status(401).send('Unauthorized');
    }

    req.auth = { userId: record.userId, keyHash };
    await storage.updateLastUsed(keyHash);
    next();
  }

  function generateRawApiKey(size = 32, format = 'base64'){
    const buffer = crypto.randomBytes(size);
    return buffer.toString(format);
  }

  function decodeCredentials(authHeader){
    try {
      const base64credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64credentials, 'base64').toString('utf-8');
      const colonIndex = credentials.indexOf(':');
      if(colonIndex < 1){
        return null;
      }
      const login = credentials.substring(0, colonIndex);
      const password = credentials.substring(colonIndex + 1);
      if(!password){
        return null;
      }
      return { login, password };
    } catch {
      return null;
    }
  }

  return app;
}