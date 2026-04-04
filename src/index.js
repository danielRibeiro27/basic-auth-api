import createApp from './app.js'; 
import createStorage from './storage.js';

const storage = createStorage();
const app = createApp(storage);
const port = 3000;
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
