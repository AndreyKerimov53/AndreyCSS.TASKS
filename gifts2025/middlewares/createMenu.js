var Gift = require("../models/gift").Gift;

module.exports = async function(req, res, next) {
    res.locals.nav = [];
    
    try {
        // Получаем все подарки для меню (только title и nick)
        var menu = await Gift.find({}, { _id: 0, title: 1, nick: 1 });
        console.log("Меню навигации:", menu);
        
        if (menu.length !== 0) {
            res.locals.nav = menu;
        }
    } catch (err) {
        console.error("Ошибка при загрузке меню:", err.message);
        res.locals.nav = []; // Если ошибка - пустое меню
    }
    
    next();
};