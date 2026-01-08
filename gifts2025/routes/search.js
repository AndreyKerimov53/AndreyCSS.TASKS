var express = require('express');
var router = express.Router();
var Gift = require('../models/gift').Gift;

/* GET поиск подарков */
router.get('/', async function(req, res, next) {
    try {
        const query = req.query.q || '';
        const category = req.query.category || '';
        
        let searchQuery = {};
        
        if (query) {
            searchQuery.$or = [
                { title: new RegExp(query, 'i') },
                { desc: new RegExp(query, 'i') },
                { 'models.name': new RegExp(query, 'i') }
            ];
        }
        
        if (category) {
            searchQuery.category = category;
        }
        
        const gifts = await Gift.find(searchQuery);
        const categories = await Gift.distinct('category');
        
        res.render('search', {
            title: 'Поиск подарков',
            gifts: gifts,
            categories: categories,
            query: query,
            selectedCategory: category
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;