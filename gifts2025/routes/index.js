var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
/* Страница Precious Peach*/
router.get('/Precious.Peach', function(req, res, next) {
    res.send("<h1>Страница Precious.Peach</h1>")
});
/* Страница Plush Pepe */
router.get('/Plush.Pepe', function(req, res, next) {
    res.send("<h1>Страница Plush Pepe</h1>")
});
/* Страница Durov's Cap */
router.get('/Durovs.Cap', function(req, res, next) {
    res.send("<h1>Страница Durovs Cap</h1>")
});

module.exports = router;
