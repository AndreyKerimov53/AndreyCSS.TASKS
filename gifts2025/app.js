var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// ============ ПОДКЛЮЧЕНИЕ MONGODB БЕЗ УСТАРЕВШИХ ОПЦИЙ ============
var mongoose = require('mongoose');

// ДЛЯ MongoDB ДРАЙВЕРА 5+: убрать старые опции
mongoose.connect('mongodb://localhost/tc2025')
  .then(() => {
    console.log('✅ Успешное подключение к MongoDB: tc2025');
  })
  .catch(err => {
    console.error('❌ Ошибка подключения MongoDB:', err.message);
  });

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Ошибка MongoDB:'));

var session = require("express-session");

// ============ connect-mongo 6.0.0 - ПРАВИЛЬНОЕ ИСПОЛЬЗОВАНИЕ ============
// В версии 6: MongoStore - это конструктор класса, а не функция create
var MongoStore = require('connect-mongo').MongoStore; // Используем правильный экспорт

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var giftsRouter = require('./routes/gifts');

var app = express();

// ============ НАСТРОЙКА ШАБЛОНИЗАТОРА ============
app.engine('ejs', require('ejs-locals'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ============ MIDDLEWARE ============
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ============ СОЗДАНИЕ STORE ДЛЯ СЕССИЙ (версия 6) ============
var sessionStore;
try {
    // ПРАВИЛЬНЫЙ СИНТАКСИС ДЛЯ connect-mongo 6
    sessionStore = new MongoStore({
        client: mongoose.connection.getClient(), // Получаем клиента из mongoose
        dbName: 'tc2025',
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60, // 14 дней
        autoRemove: 'interval',
        autoRemoveInterval: 60
    });
    console.log('✅ Session store создан в MongoDB');
} catch (error) {
    console.error('❌ Ошибка создания session store:', error.message);
    console.log('⚠️  Используем memory store (для разработки)');
    sessionStore = null;
}

// ============ НАСТРОЙКА СЕССИЙ ============
var sessionConfig = {
    secret: "TelegramGiftsSecret2025",
    cookie: { 
        maxAge: 60 * 60 * 1000, // 1 час
        httpOnly: true,
        secure: false, // false для localhost
        sameSite: 'lax'
    },
    resave: false,
    saveUninitialized: true
};

// Добавляем store если он создан
if (sessionStore) {
    sessionConfig.store = sessionStore;
} else {
    console.log('ℹ️  Сессии в памяти (OK для localhost)');
}

app.use(session(sessionConfig));

// ============ СЧЕТЧИК ПОСЕЩЕНИЙ ============
app.use(function(req, res, next) {
    req.session.counter = req.session.counter + 1 || 1;
    next();
});

// ============ ПОДКЛЮЧЕНИЕ MIDDLEWARE ============
app.use(require("./middlewares/createMenu.js"));
app.use(require("./middlewares/createUser.js"));

// ============ РОУТЫ ============
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/gifts', giftsRouter);

// ============ ОБРАБОТКА 404 ============
app.use(function(req, res, next) {
    next(createError(404));
});

// ============ ОБРАБОТКА ОШИБОК ============
app.use(function(err, req, res, next) {
    console.error('❌ Ошибка:', err.message);
    
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    
    res.status(err.status || 500);
    res.render('error', { 
        title: 'Ошибка | Telegram Gifts',
        user: req.user || null
    });
});

module.exports = app;