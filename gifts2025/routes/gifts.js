var express = require('express');
var router = express.Router();

// ============ ДОБАВЛЯЕМ ИМПОРТ МОДЕЛИ ============
var Gift = require('../models/gift').Gift;
// =================================================

// ============ ДОБАВЛЕНО ПО ЗАДАНИЮ 10.8 ============
var checkAuth = require("../middlewares/checkAuth.js");
// ===================================================

/* GET gifts listing. */
router.get('/', function(req, res, next) {
    res.send('Новый маршрутизатор, для маршрутов, начинающихся с gifts');
});

/* Страница подарков с параметром */
// ============ ДОБАВЛЕНО checkAuth КАК MIDDLEWARE (10.8) ============
router.get("/:nick", checkAuth, async function(req, res, next) {
// ===================================================================
    try {
        // ============ ЗАПРОС К БАЗЕ ДАННЫХ ============
        var gifts = await Gift.find({nick: req.params.nick});
        console.log(gifts); // Для отладки
        
        if (!gifts.length) {
            return next(new Error("Нет такого подарка в коллекции"));
        }
        
        var gift = gifts[0];
        res.render('gift', {
            title: gift.title,
            picture: gift.avatar,
            desc: gift.desc
        });
        // ================================================
    } catch (err) {
        next(err);
    }
});

module.exports = router;