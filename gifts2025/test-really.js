const { MongoClient } = require('mongodb');

async function test() {
    console.log("=== ТЕСТ РЕАЛЬНОЙ РАБОТЫ MONGODB ===");
    
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        // 1. Подключиться
        await client.connect();
        console.log("✅ Подключение к MongoDB успешно");
        
        // 2. Проверить ВСЕ базы
        const adminDb = client.db().admin();
        const dbList = await adminDb.listDatabases();
        
        console.log("\n📊 ВСЕ БАЗЫ ДАННЫХ:");
        for (const dbInfo of dbList.databases) {
            const dbName = dbInfo.name;
            if (!['admin', 'local', 'config'].includes(dbName)) {
                const db = client.db(dbName);
                const collections = await db.listCollections().toArray();
                
                console.log(`\n📁 ${dbName}:`);
                if (collections.length === 0) {
                    console.log("   Нет коллекций");
                } else {
                    for (const coll of collections) {
                        const collection = db.collection(coll.name);
                        const count = await collection.countDocuments();
                        console.log(`   📂 ${coll.name}: ${count} документов`);
                    }
                }
            }
        }
        
        // 3. Проверить конкретно tc2025
        console.log("\n🔍 ПРОВЕРКА tc2025:");
        const db = client.db('tc2025');
        const collections = await db.listCollections().toArray();
        
        if (collections.length === 0) {
            console.log("❌ В tc2025 нет коллекций!");
        } else {
            console.log(`✅ В tc2025 есть ${collections.length} коллекций:`);
            for (const coll of collections) {
                const collection = db.collection(coll.name);
                const count = await collection.countDocuments();
                console.log(`   ${coll.name}: ${count} документов`);
            }
        }
        
    } catch (error) {
        console.error("❌ Ошибка:", error.message);
    } finally {
        await client.close();
    }
}

test();