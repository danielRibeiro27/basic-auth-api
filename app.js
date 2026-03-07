//require its a import module 
import express from 'express'; //its imported as a event object
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export default function createApp(storage){

  const app = express(); //instantiate the express application by calling its function

  //users
  //id (uuid)
  //email (unique)
  //password_hash
  //created_at

  //api_keys
  //id (uuid)
  //user_id (fk)
  //key_hash (SHA-256)
  //prefix (first 8 chars of the raw key, for support/logging)
  //created_at
  //revoked_at (nullable)
  //last_used_at (nullable)

  //rules
  //Raw passwords are never stored
  //Raw API keys are never stored
  //Raw API key is returned once at creation time

  //app.get its a event listener
  //(req,res) its a callback function
  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  //receives credentials using http basic auth and returns an api key
  //status codes: 401 (unauthorized), 400 (bad request), 500 (internal), 200 (ok)
  app.post('/login', async (request, response) =>{
    if(request.headers['authorization'] === undefined){
      response.set('WWW-Authenticate', 'Basic realm="simple"'); //ask for credentials
      return response.status(401).send('Unauthorized');
    }

    if(!request.headers['authorization'].startsWith('Basic ')){
      return response.status(400).send('Bad Request');
    }

    const credentials = decodeCredentials(request.headers.authorization);
    const user = await storage.getUserByLogin(credentials.login); 
    
    if(!user || !(await bcrypt.compare(credentials.password, user.password))){
      return response.status(401).send('Unauthorized');
    }

    const rawApiKey = generateRawApiKey();
    const hashedApiKey = crypto.createHash('sha256').update(rawApiKey).digest('base64');
    const apiKeyHasBeeninserted = await storage.insertHashedApiKey(hashedApiKey);

    if(apiKeyHasBeeninserted) response.status(200).send({apiKey: rawApiKey});
    else response.status(500).send('Internal Server Error');
  });

  app.post('/api-keys/revoke', (req, res) =>{
    res.send('API Key revoked.')
  })

  app.get('/sensitive', (req, res) =>{
    //requires api key on header X-API-Key
    //hash presented key
    //look up api key on storage
    //update last used on success

    //status codes: 401 (unauthorized), 400 (bad request), 500 (internal), 200 (ok)
    res.send("Here's your sensitive data.");
  });

  app.post('/users', (req, res) => {
    res.send("User created.");
  });

  function generateRawApiKey(size = 32, format = 'base64'){
    const buffer = crypto.randomBytes(size);
    return buffer.toString(format);
  }

  function decodeCredentials(authHeader){
    const base64credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64credentials, 'base64').toString('utf-8');

    return { login: credentials.split(':')[0], password: credentials.split(':')[1]}
  }

  return app;
}