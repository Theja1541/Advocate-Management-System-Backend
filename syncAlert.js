const Alert = require('./src/features/alerts/Alert');
Alert.sync({ force: true }).then(() => {
    console.log('synced with force: true');
    process.exit(0);
}).catch(console.error);
