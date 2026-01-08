var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var giftSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    nick: {
        type: String,
        unique: true,
        required: true
    },
    avatar: String,
    desc: String,
    price: Number,
    category: String,
    models: [{
        name: String,
        rarity: String,
        quantity: Number,
        price: Number,
        // ВАЖНО: Добавленные поля
        telegramLink: String,
        image: String,
        description: String
    }],
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports.Gift = mongoose.model("Gift", giftSchema);