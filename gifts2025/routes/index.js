var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    // Cookie из задания 9.2 
    res.cookie('greeting', 'Hi!!!');
    
    // Данные в сессии из задания 9.3
    req.session.greeting = "Hi!!!";
    
    // ============ ДОБАВЛЕНО ПО ЗАДАНИЮ 9.4 ============
    res.render('index', { 
        title: 'Telegram Gifts',
        counter: req.session.counter  // ← ПЕРЕДАЁМ СЧЁТЧИК В ШАБЛОН
    });
    // ===================================================
});

/* Общая страница подарков */
router.get('/gift', function(req, res, next) {
    res.render('gift', { 
        title: 'Подарки',
        picture: 'images/gift.jpg',
        desc: 'Выберите подарок из нашей коллекции'
    });
});

/* ============ ДОБАВЛЕНО ПО ЗАДАНИЮ 10.1 ============ */
/* GET login/registration page. */
router.get('/logreg', function(req, res, next) {
    res.render('logreg', { title: 'Вход' });
});
/* =================================================== */

/* ============ ДОБАВЛЕНО ПО ЗАДАНИЮ 10.3 ============ */
/* POST login/registration page. */
router.post('/logreg', function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    
    console.log(username);
    console.log(password);
    
    res.redirect('/');
});
/* =================================================== */

module.exports = router;