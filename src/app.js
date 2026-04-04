import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export default function createApp(storage){

  const app = express(); //instantiate the express application by calling its function
  app.use(express.json()); //parse incoming JSON requests

  /**
   * Middleware apply to all /sensitive that authenticates api key
   * @returns {HttpCode} 200 (ok)
   * @returns {HttpCode} 400 (bad api key format)
   * @returns {HttpCode} 401 (missing or invalid api key)
   * @returns {HttpCode} 500 (internal server error)
   */
  app.use('/sensitive', authenticateApiKey);

    
  async function authenticateApiKey(req, res, next){
    const apiKey = req.headers['x-api-key'];
    if(apiKey === undefined){
      return res.status(401).send('Unauthorized');
    }

    if(apiKey.split('.').length !== 2){
      return res.status(400).send('Bad Request');
    }

    const prefix = apiKey.split('.')[0];
    const presentedKey = apiKey.split('.')[1];
    const hashedPresentedKey = crypto.createHash('sha256')
                                    .update(presentedKey)
                                    .digest('hex');
    const prefixedHashedPresentedKey = `${prefix}.${hashedPresentedKey}`;

    const storedKey = await storage.getUnrevokedApiKeyByPrefixedHashedKey(prefixedHashedPresentedKey);
    if(!storedKey){
      return res.status(401).send('Unauthorized');
    }

    //update last used is not essential, so lets not await it and not care about possible errors on that operation for now
    storage.updateApiKeyAsync({...storedKey, lastUsedAt: new Date()});
    next();
  }

  /**
   * @returns {HttpCode} 200 (ok)
   * @devnote app.get is a event listener
   * @devnote (req,res) is a callback function
   */
  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  /**
   * Receives credentials using http basic auth and returns an api key
   * @headers {Authorization} Basic base64(login:password)
   * @returns {HttpCode} 401 (unauthorized)
   * @returns {HttpCode} 400 (bad request)
   * @returns {HttpCode} 500 (internal server error)
   * @returns {HttpCode} 200 (ok)
   */
  app.post('/login', async (req, res) =>{
    if(req.headers['authorization'] === undefined){
      res.set('WWW-Authenticate', 'Basic realm="simple"'); //ask for credentials
      return res.status(401).send('Unauthorized');
    }

    if(!req.headers['authorization'].startsWith('Basic ')) return res.status(400).send('Bad Request');

    const credentials = decodeCredentials(req.headers.authorization);
    const user = await storage.getUserByLoginAsync(credentials.login); 
    
    if(!user || !(await bcrypt.compare(credentials.password, user.password))){
      return res.status(401).send('Unauthorized');
    }

    const { newApiKey, prefixPlusUnhashedKey } = generateApiKey(user);
    const apiKeyHasBeenInserted = await storage.createApiKeyAsync(newApiKey);

    if(apiKeyHasBeenInserted) res.status(200).send({apiKey: prefixPlusUnhashedKey});
    else res.status(500).send('The API Key could not be generated. Please try again later.');
  });

  //TODO: Implement revoke api key endpoint
  app.post('/sensitive/api-keys/revoke', (req, res) =>{
    res.send('API Key revoked.')
  });

  /**
   * @returns {HttpCode} 200 (ok)
   * @devnote protected by authenticateApiKey middleware
   */
  app.get('/sensitive/hello', (req, res) =>{
    res.send("Here's your sensitive data.");
  });

  /**
   * Creates a new user with login and password
   * @headers {Content-Type} application/json
   * @body {login} string
   * @body {password} string
   * @returns {HttpCode} 400 (bad request)
   * @returns {HttpCode} 500 (internal server error)
   * @returns {HttpCode} 200 (ok)
   */
  app.post('/user', async (req, res) => {
    if(!req.body){
      return res.status(400).send('Bad Request');
    }
    const { login, password } = req.body;
    if(!login || !password){
      return res.status(400).send('Bad Request');
    }
    if(typeof login !== 'string' || typeof password !== 'string'){
      return res.status(400).send('Bad Request');
    }
    if(login.length === 0 || password.length === 0){
      return res.status(400).send('Bad Request');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userCreated = await storage.createUserAsync({ login, password: hashedPassword });

    if(userCreated) res.status(201).send('User created.');
    else res.status(500).send('The user could not be created. Please try again later.');
  });

  function decodeCredentials(authHeader){
    const base64credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64credentials, 'base64').toString('utf-8');

    return { login: credentials.split(':')[0], password: credentials.split(':')[1]}
  }

  function generateApiKey(user){
    const originalUnhashedKey = crypto.randomUUID();
    const prefix = 'prefix';
    const hashedKey = crypto.createHash('sha256') //hash class instance
                        .update(originalUnhashedKey) //push the data to be hashed
                        .digest('hex'); //calculate final hash and return it as hex string

    const prefixPlusHashedKey = `${prefix}.${hashedKey}`;
    const prefixPlusUnhashedKey = `${prefix}.${originalUnhashedKey}`;
    
    return {newApiKey: {
        userId: user.id,
        prefixedKeyHash: prefixPlusHashedKey, 
        prefix: prefix,
        createdAt: new Date(),
        revokedAt: null,
        lastUsedAt: null
    }, prefixPlusUnhashedKey}
  }

  return app;
}