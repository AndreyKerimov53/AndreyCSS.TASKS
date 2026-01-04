var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
/* Страница Precious Peach*/
router.get('/Precious.Peach', function(req, res, next) {
    
    res.render('gift', { 
        title: "Precious Peach", // Можно передать данные, специфичные для этого маршрута
        picture: "images/peach.webp",
        desc: "Самый дорогой персик в вашей жизни, жаль нельзя съесть."
    });
});
/* Страница Plush Pepe (теперь использует index.ejs) */
router.get('/Plush.Pepe', function(req, res, next) {
    
    res.render('gift', { 
        title: "Plush Pepe", // Можно передать данные, специфичные для этого маршрута
        picture: "images/plush pepe.jfif",
        desc: "Самый ценный и очень живой! Этот подарок создан для тех, кто ценит деньги, движение и нескончаемый заряд позитива."
    });
});
/* Страница Durov's Cap */
router.get('/Durovs.Cap', function(req, res, next) {
    
    res.render('gift', { 
        title: "Durov's Cap", // Можно передать данные, специфичные для этого маршрута
        picture: "images/durov.caps.png",
        desc: "Кепка с которой вам точно будет не жарко, ведь имея эту кепку вы всегда с вентилятором."
    });
});

module.exports = router;
