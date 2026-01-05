var User = require("../models/user").User;

module.exports = async function(req, res, next) {
    res.locals.user = null;
    
    try {
        // Проверяем, есть ли user_id в сессии
        if (req.session.user_id) {
            // findById возвращает ОДИН документ, не массив
            var user = await User.findById(req.session.user_id);
            if (user) {
                res.locals.user = user;
                console.log("Пользователь найден:", user.username);
            }
        }
    } catch (err) {
        console.error("Ошибка при загрузке пользователя:", err.message);
        res.locals.user = null;
    }
    
    next();
};