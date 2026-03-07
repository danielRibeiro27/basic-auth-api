//require its a import module 
import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export default function createApp(storage) {
  const app = express();

  app.use(express.json());

  async function authenticateApiKey(req, res, next) {
    const rawKey = req.headers['x-api-key'];
    if (!rawKey) {
      return res.status(401).send('Unauthorized');
    }

    const hash = crypto.createHash('sha256').update(rawKey).digest('base64');
    const keyRecord = await storage.getApiKeyByHash(hash);

    if (!keyRecord) {
      return res.status(401).send('Unauthorized');
    }

    if (keyRecord.revoked_at !== null) {
      return res.status(401).send('Unauthorized');
    }

    req.auth = { userId: keyRecord.userId };
    req.apiKeyHash = hash;
    await storage.updateLastUsed(hash);
    next();
  }

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  app.post('/login', async (req, res) => {
    if (req.headers['authorization'] === undefined) {
      res.set('WWW-Authenticate', 'Basic realm="simple"');
      return res.status(401).send('Unauthorized');
    }

    if (!req.headers['authorization'].startsWith('Basic ')) {
      return res.status(400).send('Bad Request');
    }

    const credentials = decodeCredentials(req.headers.authorization);
    if (!credentials) {
      return res.status(400).send('Bad Request');
    }

    const user = await storage.getUserByLogin(credentials.login);

    if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
      return res.status(401).send('Unauthorized');
    }

    const rawApiKey = generateRawApiKey();
    const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('base64');
    const prefix = rawApiKey.substring(0, 8);

    await storage.insertApiKey({
      id: crypto.randomUUID(),
      userId: user.id,
      keyHash,
      prefix,
      createdAt: new Date().toISOString(),
    });

    res.status(200).send({ apiKey: rawApiKey });
  });

  app.post('/api-keys/revoke', authenticateApiKey, async (req, res) => {
    await storage.revokeApiKey(req.apiKeyHash);
    res.status(200).send({ revoked: true });
  });

  app.get('/sensitive', authenticateApiKey, async (req, res) => {
    res.status(200).send({ userId: req.auth.userId, message: "Here's your sensitive data." });
  });

  app.post('/users', async (req, res) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).send('Bad Request');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();
    const result = storage.insertUser({
      id,
      email,
      password: passwordHash,
      createdAt: new Date().toISOString(),
    });

    if (!result.success) {
      return res.status(409).send('Conflict');
    }

    res.status(201).send({ id, email });
  });

  function generateRawApiKey(size = 32, format = 'base64') {
    const buffer = crypto.randomBytes(size);
    return buffer.toString(format);
  }

  function decodeCredentials(authHeader) {
    try {
      const base64credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64credentials, 'base64').toString('utf-8');
      const colonIndex = credentials.indexOf(':');
      if (colonIndex === -1) {
        return null;
      }
      return {
        login: credentials.substring(0, colonIndex),
        password: credentials.substring(colonIndex + 1),
      };
    } catch {
      return null;
    }
  }

  return app;
}