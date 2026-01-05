var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/tc2025'); // Ваша база!

var User = require('./models/user.js').User;

async function testUser() {
    try {
        // Создаём пользователя
        var first_user = new User({
            username: "Vasya",
            password: "qwerty"
        });

        // Сохраняем в базу
        await first_user.save();
        console.log('✅ Пользователь Vasya создан!');
        console.log('   Salt:', first_user.salt);
        console.log('   Hashed password:', first_user.hashedPassword);
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        if (error.code === 11000) {
            console.log('   Пользователь Vasya уже существует!');
        }
    } finally {
        mongoose.connection.close();
    }
}

testUser();