require('dotenv').config();
const db = require('./src/features/associations');

async function syncAll() {
    console.log('Starting syncAll with alter: true on DB:', process.env.DB_NAME);
    for (const modelName of Object.keys(db)) {
        if (db[modelName] && typeof db[modelName].sync === 'function') {
            try {
                await db[modelName].sync({ alter: true });
                console.log(`Synced ${modelName}`);
            } catch (err) {
                console.error(`Error syncing ${modelName}:`, err.message);
            }
        }
    }
    console.log('All models synced.');
    process.exit(0);
}

syncAll();
