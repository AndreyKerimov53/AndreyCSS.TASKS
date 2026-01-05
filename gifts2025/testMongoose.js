const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/testMongoose2025');

const Gift = mongoose.model('Gift', { name: String });

const gift = new Gift({ name: 'Тестовый подарок' });
gift.save().then(() => console.log('Подарок сохранён!'));