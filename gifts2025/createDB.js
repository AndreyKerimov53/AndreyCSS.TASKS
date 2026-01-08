const { MongoClient } = require('mongodb');
var data = require("./data.js").data;

console.log("Загружаем данные с моделями...");

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'tc2025';

async function main() {
    await client.connect();
    console.log('Подключено к серверу MongoDB');
    const db = client.db(dbName);
    const collection = db.collection('gifts');
    
    // Очищаем старые данные
    await collection.deleteMany({});
    console.log('Старые данные удалены');
    
    // Вставляем новые данные с моделями
    const insertResult = await collection.insertMany(data);
    console.log('Добавлено подарков:', insertResult.insertedCount);
    
    // Выводим информацию о моделях
    data.forEach(gift => {
        console.log(`\n${gift.title}: ${gift.models.length} моделей`);
        gift.models.forEach(model => {
            console.log(`  - ${model.name}: ${model.rarity}, ${model.quantity} шт., $${model.price}`);
        });
    });
    
    return 'База данных обновлена с моделями!';
}

main()
    .then(console.log)
    .catch(console.error)
    .finally(() => client.close());