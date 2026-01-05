var express = require('express');
var router = express.Router();
// ============ ДОБАВЛЕНО ПО ЗАДАНИЮ 10.4 ============
var User = require('../models/user').User;
// ===================================================

/* GET home page. */
router.get('/', function(req, res, next) {
    res.cookie('greeting', 'Hi!!!');
    req.session.greeting = "Hi!!!";
    
    res.render('index', { 
        title: 'Telegram Gifts',
        counter: req.session.counter
    });
});

/* Общая страница подарков */
router.get('/gift', function(req, res, next) {
    res.render('gift', { 
        title: 'Подарки',
        picture: 'images/gift.jpg',
        desc: 'Выберите подарок из нашей коллекции'
    });
});

/* GET login/registration page. */
router.get('/logreg', function(req, res, next) {
    // ============ ДОБАВЛЕНО ПО ЗАДАНИЮ 10.6 ============
    res.render('logreg', { 
        title: 'Вход',
        error: null  // ← Добавляем параметр error со значением null
    });
    // ====================================================
});

/* POST login/registration page. */
router.post('/logreg', async function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    
    console.log(username);
    console.log(password);
    
    // Ищем пользователя в базе
    var users = await User.find({username: username});
    console.log(users);
    
    if (!users.length) {
        // ============ ПОЛЬЗОВАТЕЛЬ НЕ НАЙДЕН - СОЗДАЁМ НОВОГО ============
        console.log("Создаём нового пользователя:", username);
        var user = new User({username: username, password: password});
        await user.save();
        req.session.user_id = user._id; // Сохраняем ID в сессии
        res.redirect('/');
        // =================================================================
    } else {
        // ============ ПОЛЬЗОВАТЕЛЬ НАЙДЕН - ПРОВЕРЯЕМ ПАРОЛЬ ============
        var foundUser = users[0];
        if (foundUser.checkPassword(password)) {
            console.log("Пароль верный, пользователь вошёл");
            req.session.user_id = foundUser._id; // Сохраняем ID в сессии
            res.redirect('/');
        } else {
            console.log("Неправильный пароль для:", username);
            // ============ ДОБАВЛЕНО ПО ЗАДАНИЮ 10.6 ============
            res.render('logreg', {
                title: 'Вход',
                error: 'Пароль не верный'  // ← Передаем сообщение об ошибке
            });
            // ====================================================
        }
        // ================================================================
    }
});
module.exports = router;