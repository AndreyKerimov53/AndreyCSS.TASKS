var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Telegram Gifts' });
});

/* Общая страница подарков (можно оставить или удалить) */
router.get('/gift', function(req, res, next) {
  res.render('gift', { 
    title: 'Подарки',
    picture: 'images/gift.jpg',
    desc: 'Выберите подарок из нашей коллекции'
  });
});
module.exports = router;