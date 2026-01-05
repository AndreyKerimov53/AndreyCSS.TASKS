const mongoose = require('mongoose');

// Подключение к БД
mongoose.connect('mongodb://127.0.0.1:27017/testMongoose2025');

// Создание схемы
var schema = mongoose.Schema({ 
    name: String,
    price: Number
});

// Добавление метода
schema.methods.describe = function() {
    console.log(this.name + " стоит " + (this.price || 0) + " руб.");
};

// Создание модели
const Gift = mongoose.model('Gift', schema);

// Создание экземпляра
const gift = new Gift({ 
    name: 'Тестовый подарок',
    price: 999 
});

// Сохранение и завершение
gift.save()
    .then(() => {
        gift.describe(); // Вызов метода
        
        // ЯВНОЕ ЗАВЕРШЕНИЕ
        mongoose.connection.close();
        console.log("✅ Соединение закрыто, скрипт завершён.");
        process.exit(0); // Завершение процесса Node.js
    })
    .catch(err => {
        console.error("❌ Ошибка:", err.message);
        mongoose.connection.close();
        process.exit(1);
    });