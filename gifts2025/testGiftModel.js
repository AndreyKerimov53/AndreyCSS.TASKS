const mongoose = require('mongoose');

// 1. Подключаемся к РАБОЧЕЙ БАЗЕ вашего приложения
mongoose.connect('mongodb://127.0.0.1:27017/tc2025');
console.log("=== ТЕСТ МОДЕЛИ GIFT ИЗ ФАЙЛА models/gift.js ===");
console.log("Подключение к БД 'tc2025'...\n");

// 2. Импортируем РЕАЛЬНУЮ модель приложения
const Gift = require('./models/gift.js').Gift;

async function runTest() {
    try {
        // 3. Создаём новый подарок ПО ВАШЕЙ СХЕМЕ
        const newGift = new Gift({
            title: "Эксклюзивный золотой персик",
            nick: "golden.peach.test", // Уникальный ключ для URL
            avatar: "/images/golden_peach.jpg",
            desc: "Очень редкий тестовый экземпляр. Создан для проверки модели.",
            price: 50000
        });

        console.log("Создан объект нового подарка:");
        console.log(newGift);
        console.log("\nПытаюсь сохранить в БД...");

        // 4. Сохраняем. Здесь сработает ВАША валидация (required, unique)
        const savedGift = await newGift.save();

        console.log("\n✅ УСПЕХ! Подарок сохранён в коллекции 'gifts':");
        console.log("   ID:", savedGift._id);
        console.log("   Название:", savedGift.title);
        console.log("   Nick (для URL):", savedGift.nick);
        console.log("   Цена:", savedGift.price, "руб.");
        console.log("   Дата создания:", savedGift.created);

        // 5. Дополнительная проверка: ищем только что сохранённый подарок
        console.log("\n--- Проверка поиска по nick ---");
        const foundGift = await Gift.findOne({ nick: "golden.peach.test" });
        if (foundGift) {
            console.log("✅ Поиск работает. Найден подарок:", foundGift.title);
        } else {
            console.log("❌ Ошибка: Подарок не найден после сохранения.");
        }

    } catch (error) {
        console.error("\n❌ ОШИБКА при работе с моделью:");
        console.error("   Тип:", error.name);
        console.error("   Сообщение:", error.message);
        
        // Особо обрабатываем ошибку "дубликат ключа"
        if (error.code === 11000) {
            console.error("\n   ВНИМАНИЕ: Подарок с таким 'nick' уже существует!");
            console.error("   Измените значение nick в тесте и запустите снова.");
        }
        
        // Показываем ошибки валидации (например, нет обязательного поля)
        if (error.name === 'ValidationError') {
            for (let field in error.errors) {
                console.error(`   Поле "${field}":`, error.errors[field].message);
            }
        }
    } finally {
        // 6. Аккуратно закрываем соединение
        await mongoose.connection.close();
        console.log("\nСоединение с MongoDB закрыто.");
    }
}

// Запускаем тест
runTest();