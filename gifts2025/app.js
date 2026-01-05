var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/tc2025');

var session = require("express-session");

// ============ ДЛЯ ВЕРСИИ 6.0.0 ============
const MongoStore = require('connect-mongo').default;
// ==========================================

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var giftsRouter = require('./routes/gifts');

var app = express();

app.engine('ejs', require('ejs-locals'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: "TelegramGifts",
    cookie: { maxAge: 60 * 1000 },
    proxy: true,
    resave: true,
    saveUninitialized: true,
    
    store: new MongoStore({
        mongoUrl: 'mongodb://localhost/tc2025'
    })
}));

// ============ ДОБАВЛЕНО ПО ЗАДАНИЮ 9.4 ============
// Middleware счётчика посещений (после сессии, перед роутерами!)
app.use(function(req, res, next) {
    req.session.counter = req.session.counter + 1 || 1;
    next();
});
// ==================================================

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/gifts', giftsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error', { 
        title: 'Telegram Gifts'  
    });
});

module.exports = app;