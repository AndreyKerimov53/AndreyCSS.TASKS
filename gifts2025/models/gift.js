var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var giftSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    nick: {
        type: String,
        unique: true,       // Уникальный идентификатор для URL
        required: true
    },
    avatar: String,         // Путь к изображению
    desc: String,           // Описание
    price: Number,          // Добавим цену, как в вашем testMongoose.js
    created: {
        type: Date,
        default: Date.now
    }
});

// Экспортируем модель. Используем имя "Gift"
module.exports.Gift = mongoose.model("Gift", giftSchema);