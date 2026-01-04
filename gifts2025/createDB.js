const { MongoClient } = require('mongodb');
var data = require("./data.js").data;

console.log("Данные для импорта в БД:");
console.log(data);

// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'tc2025';

async function main() {
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('gifts'); // Новая коллекция

    // Вставляем данные из data.js
    const insertResult = await collection.insertMany(data);
    console.log('Inserted gifts =>', insertResult.insertedCount);
    
    return 'done. Data imported successfully.';
}

main()
    .then(console.log)
    .catch(console.error)
    .finally(() => client.close());