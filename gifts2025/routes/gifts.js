var express = require('express');
var router = express.Router();
var createError = require('http-errors');

var Gift = require('../models/gift').Gift;
var checkAuth = require("../middlewares/checkAuth.js");

/* GET главная страница всех подарков */
router.get('/', function(req, res, next) {
    res.send('Новый маршрутизатор, для маршрутов, начинающихся с gifts');
});

/* GET страница коллекции (список моделей в 2 столбца) */
router.get("/:nick", checkAuth, async function(req, res, next) {
    try {
        var gifts = await Gift.find({nick: req.params.nick});
        console.log('Найден подарок:', gifts[0]?.title);
        
        if (!gifts.length) {
            return next(createError(404, "Нет такого подарка в коллекции"));
        }
        
        var gift = gifts[0];

if (!gift.models || gift.models.length === 0) {
    console.log('У подарка нет моделей, создаем тестовые...');
    gift.models = generateDemoModels(gift.title);
    
    // 🔥 ВАЖНО: Сохраните модели в БД!
    console.log('💾 Сохраняю созданные модели в БД...');
    try {
        await Gift.updateOne(
            { _id: gift._id },
            { $set: { models: gift.models } }
        );
        console.log('✅ Модели сохранены в БД! Количество:', gift.models.length);
        
        const updatedGift = await Gift.findOne({ _id: gift._id });
                console.log('📊 Модели в БД после сохранения:', updatedGift.models?.length || 0);
                if (updatedGift.models && updatedGift.models.length > 0) {
                    console.log('Первая модель в БД:', {
                        name: updatedGift.models[0].name,
                        image: updatedGift.models[0].image,
                        telegramLink: updatedGift.models[0].telegramLink
                    });
                }
        
        // Проверьте Cozy Galaxy
        const cozyGalaxy = gift.models.find(m => m.name === 'Cozy Galaxy');
        if (cozyGalaxy) {
            console.log('🔍 Cozy Galaxy данные:', {
                image: cozyGalaxy.image,
                telegramLink: cozyGalaxy.telegramLink
            });
        }
    } catch (err) {
        console.error('❌ Ошибка сохранения в БД:', err.message);
    }
}

console.log('Количество моделей:', gift.models.length);
        
        const formattedModels = gift.models.map((model, index) => {
            // Создаем ID из имени модели (без MongoDB ID)
            const modelId = model.name 
                ? model.name.toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/gi, '')
                : `${gift.nick}-${index + 1}`;
            
            // Определяем класс редкости для стилей
            let rarityClass = '24';
            if (model.rarity) {
                const rarityNum = parseFloat(model.rarity);
                if (rarityNum < 0.5) rarityClass = '01';
                else if (rarityNum < 2) rarityClass = '05';
                else if (rarityNum < 10) rarityClass = '5';
            }
            
            return {
                id: modelId, // Чистый ID из имени
                name: model.name,
                rarity: model.rarity,
                rarityClass: rarityClass,
                stock: model.quantity || 10,
                image: model.image || `/images/${gift.nick}/${modelId}.jpg`,
                telegramLink: model.telegramLink
            };
        });
        
        res.render('gift-with-models', {
            title: `${gift.title} | Telegram Gifts`,
            picture: gift.avatar || gift.picture || '/images/default.jpg',
            desc: gift.desc || 'Коллекция моделей',
            gift: gift,
            collection: {
                title: gift.title,
                subtitle: gift.desc || 'Коллекция моделей',
                nick: gift.nick,
                stats: {
                    totalModels: formattedModels.length,
                    totalStock: formattedModels.reduce((sum, model) => sum + parseInt(model.stock), 0)
                }
            },
            models: formattedModels,
            user: req.user || null,
            nav: req.nav || []
        });
        
    } catch (err) {
        next(err);
    }
});

/* GET детальная страница конкретной модели */
router.get("/:nick/:modelId", checkAuth, async function(req, res, next) {
    try {
        const { nick, modelId } = req.params;
        
        var gifts = await Gift.find({ nick: nick });
        if (!gifts.length) {
            return next(createError(404, "Коллекция не найдена"));
        }
        
          var gift = gifts[0];
        
        // 👇 ДОБАВЬТЕ ЭТУ ПРОВЕРКУ ДЛЯ ВСЕХ МОДЕЛЕЙ 👇
        let needToRegenerate = false;
        
        if (!gift.models || gift.models.length === 0) {
            console.log('🔄 Нет моделей, создаем...');
            needToRegenerate = true;
        } else {
            // Проверяем первую модель на полноту данных
            const sampleModel = gift.models[0];
            if (!sampleModel.image || !sampleModel.telegramLink) {
                console.log('🔄 Модели неполные, пересоздаем...');
                needToRegenerate = true;
            }
        }
        
        if (needToRegenerate) {
            gift.models = generateDemoModels(gift.title);
            console.log('💾 Сохраняю обновленные модели в БД...');
            
            try {
                await Gift.updateOne(
                    { _id: gift._id },
                    { $set: { models: gift.models } }
                );
                console.log('✅ Все модели обновлены в БД');
            } catch (err) {
                console.error('❌ Ошибка сохранения:', err.message);
            }
        }
        // 👆 КОНЕЦ ПРОВЕРКИ 👆
        
        // Ищем модель по имени (преобразуем URL к формату имени)
        let model;
        const modelNameFromUrl = modelId
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
        
        model = gift.models.find(m => 
            m.name && m.name.toLowerCase() === modelNameFromUrl.toLowerCase()
        );
        
        // Если не нашли, берем первую модель
        if (!model) {
            model = gift.models[0];
        }
        
        if (!model) {
            return next(createError(404, "Модель не найдена"));
        }
        
        // Определяем класс редкости
        let rarityClass = '24';
        if (model.rarity) {
            const rarityNum = parseFloat(model.rarity);
            if (rarityNum < 0.5) rarityClass = '01';
            else if (rarityNum < 2) rarityClass = '05';
            else if (rarityNum < 10) rarityClass = '5';
        }
        
        // Создаем чистый ID из имени
        const cleanModelId = model.name 
            ? model.name.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/gi, '')
            : modelId;
        // ДОБАВЬТЕ ПРЯМО ПЕРЕД const formattedModel = {...}
console.log('🔍 === ДЕТАЛЬНАЯ ОТЛАДКА Cozy Galaxy ===');
console.log('1. Объект model:', model);
console.log('2. Все свойства model:', Object.keys(model));
console.log('3. model.telegramLink:', model.telegramLink);
console.log('4. Тип model.telegramLink:', typeof model.telegramLink);
console.log('5. Значение точно:', "'" + model.telegramLink + "'");
console.log('6. Есть ли telegramLink в model?', 'telegramLink' in model);

// Проверьте ВСЕ возможные имена свойства
console.log('7. Возможные имена:');
console.log('   - model.link:', model.link);
console.log('   - model.url:', model.url);
console.log('   - model.nftLink:', model.nftLink);
console.log('   - model.telegram_link:', model.telegram_link);

// Полный дамп объекта
console.log('8. Весь объект model в JSON:');
console.log(JSON.stringify(model, null, 2));
        const formattedModel = {
            id: cleanModelId,
            name: model.name,
            rarity: model.rarity,
            rarityClass: rarityClass,
            stock: model.quantity || 10,
            image: model.image || `/images/${gift.nick}/${cleanModelId}.jpg`,
            telegramLink: model.telegramLink,
            description: model.description || `Модель ${model.name}`
        };
        
        res.render('model-detail', {
            title: `${formattedModel.name} | Telegram Gifts`,
            collection: {
                title: gift.title,
                subtitle: gift.desc,
                nick: gift.nick
            },
            model: formattedModel,
            user: req.user || null,
            nav: req.nav || []
        });
        
    } catch (err) {
        next(err);
    }
});

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============

function generateDemoModels(giftTitle) {
    console.log('Генерация моделей для:', giftTitle);
    
    const models = [];
    
    // Наборы моделей для разных коллекций
    const modelSets = {
        'Plush Pepe': [
            // ← ВСЕ МОДЕЛИ PLUSH PEPE НАЧАЛО (59 моделей) →
            { name: 'Cozy Galaxy', rarity: '1%', quantity: 28, image: '/images/plush-pepe/Cozy.Galaxy.webp', telegramLink: 'https://t.me/nft/plushpepe-2653' },
            { name: 'Donatello', rarity: '1%', quantity: 28, image: '/images/plush-pepe/donatello.png', telegramLink: 'https://t.me/nft/plushpepe-1543' },
            { name: 'Emerald Plush', rarity: '1%', quantity: 28, image: '/images/plush-pepe/emerald-plush.png', telegramLink: 'https://t.me/nft/plushpepe-22' },
            { name: 'Fifty Shades', rarity: '1%', quantity: 28, image: '/images/plush-pepe/Fifty.Shades.png', telegramLink: 'https://t.me/nft/plushpepe-2264' },
            { name: 'Gucci Leap', rarity: '1%', quantity: 28, image: '/images/plush-pepe/Gucci.Leap.png', telegramLink: 'https://t.me/nft/plushpepe-1551' },
            { name: 'Leonardo', rarity: '1%', quantity: 28, image: '/images/plush-pepe/Leonardo.png', telegramLink: 'https://t.me/nft/plushpepe-1756' },
            { name: 'Louis Vuittoad', rarity: '1%', quantity: 28, image: '/images/plush-pepe/Louis.Vuittoad.png', telegramLink: 'https://t.me/nft/plushpepe-2015' },
            { name: 'Magnate', rarity: '1%', quantity: 28, image: '/images/plush-pepe/Magnate.png', telegramLink: 'https://t.me/nft/plushpepe-798' },
            { name: 'Midas Pepe', rarity: '1%', quantity: 28, image: '/images/plush-pepe/midas-pepe.png', telegramLink: 'https://t.me/nft/plushpepe-2133' },
            { name: 'Ninja Mike', rarity: '1%', quantity: 28, image: '/images/plush-pepe/ninja-mike.png', telegramLink: 'https://t.me/nft/plushpepe-84' },
            { name: 'Puppy Pug', rarity: '1%', quantity: 28, image: '/images/plush-pepe/puppy-pug.png', telegramLink: 'https://t.me/nft/plushpepe-1961' },
            { name: 'Raphael', rarity: '1%', quantity: 28, image: '/images/plush-pepe/raphael.png', telegramLink: 'https://t.me/nft/plushpepe-1606' },
            { name: 'Steel Frog', rarity: '1%', quantity: 28, image: '/images/plush-pepe/steel-frog.png', telegramLink: 'https://t.me/nft/plushpepe-1875' },
            { name: 'Toading', rarity: '1%', quantity: 28, image: '/images/plush-pepe/toading.png', telegramLink: 'https://t.me/nft/plushpepe-1877' },
            { name: 'Amalgam', rarity: '2%', quantity: 56, image: '/images/plush-pepe/amalgam.png', telegramLink: 'https://t.me/nft/plushpepe-2609' },
            { name: 'Barcelona', rarity: '2%', quantity: 56, image: '/images/plush-pepe/barcelona.png', telegramLink: 'https://t.me/nft/plushpepe-12' },
            { name: 'Bavaria', rarity: '2%', quantity: 56, image: '/images/plush-pepe/bavaria.png', telegramLink: 'https://t.me/nft/plushpepe-1797' },
            { name: 'Birmingham', rarity: '2%', quantity: 56, image: '/images/plush-pepe/birmingham.png', telegramLink: 'https://t.me/nft/plushpepe-2105' },
            { name: 'Christmas', rarity: '2%', quantity: 56, image: '/images/plush-pepe/christmas.png', telegramLink: 'https://t.me/nft/plushpepe-2090' },
            { name: 'Emo Boi', rarity: '2%', quantity: 56, image: '/images/plush-pepe/emo-boi.png', telegramLink: 'https://t.me/nft/plushpepe-1736' },
            { name: 'Frozen', rarity: '2%', quantity: 56, image: '/images/plush-pepe/frozen.png', telegramLink: 'https://t.me/nft/plushpepe-60' },
            { name: 'Kung Fu Pepe', rarity: '2%', quantity: 56, image: '/images/plush-pepe/kung-fu-pepe.png', telegramLink: 'https://t.me/nft/plushpepe-2263' },
            { name: 'Marble', rarity: '2%', quantity: 56, image: '/images/plush-pepe/marble.png', telegramLink: 'https://t.me/nft/plushpepe-751' },
            { name: 'Milano', rarity: '2%', quantity: 56, image: '/images/plush-pepe/milano.png', telegramLink: 'https://t.me/nft/plushpepe-1744' },
            { name: 'Pepe La Rana', rarity: '2%', quantity: 56, image: '/images/plush-pepe/pepe-la-rana.png', telegramLink: 'https://t.me/nft/plushpepe-406' },
            { name: 'Pink Galaxy', rarity: '2%', quantity: 56, image: '/images/plush-pepe/pink-galaxy.png', telegramLink: 'https://t.me/nft/plushpepe-2144' },
            { name: 'Pink Latex', rarity: '2%', quantity: 56, image: '/images/plush-pepe/pink-latex.png', telegramLink: 'https://t.me/nft/plushpepe-101' },
            { name: 'Princess', rarity: '2%', quantity: 56, image: '/images/plush-pepe/princess.png', telegramLink: 'https://t.me/nft/plushpepe-2285' },
            { name: 'Red Pepple', rarity: '2%', quantity: 56, image: '/images/plush-pepe/red-pepple.png', telegramLink: 'https://t.me/nft/plushpepe-1384' },
            { name: 'Santa Pepe', rarity: '2%', quantity: 56, image: '/images/plush-pepe/santa-pepe.png', telegramLink: 'https://t.me/nft/plushpepe-1450' },
            { name: 'Sketchy', rarity: '2%', quantity: 56, image: '/images/plush-pepe/sketchy.png', telegramLink: 'https://t.me/nft/plushpepe-154' },
            { name: 'Stripes', rarity: '2%', quantity: 56, image: '/images/plush-pepe/stripes.png', telegramLink: 'https://t.me/nft/plushpepe-673' },
            { name: 'Sunset', rarity: '2%', quantity: 56, image: '/images/plush-pepe/sunset.png', telegramLink: 'https://t.me/nft/plushpepe-1768' },
            { name: 'Two Face', rarity: '2%', quantity: 56, image: '/images/plush-pepe/two-face.png', telegramLink: 'https://t.me/nft/plushpepe-1610' },
            { name: 'X-Ray', rarity: '2%', quantity: 56, image: '/images/plush-pepe/x-ray.png', telegramLink: 'https://t.me/nft/plushpepe-1519' },
            { name: 'Yellow Purp', rarity: '2%', quantity: 56, image: '/images/plush-pepe/yellow-purp.png', telegramLink: 'https://t.me/nft/plushpepe-1675' },
            { name: 'Aqua Plush', rarity: '3%', quantity: 84, image: '/images/plush-pepe/aqua-plush.png', telegramLink: 'https://t.me/nft/plushpepe-367' },
            { name: 'Cold Heart', rarity: '3%', quantity: 84, image: '/images/plush-pepe/cold-heart.png', telegramLink: 'https://t.me/nft/plushpepe-1802' },
            { name: 'Eggplant', rarity: '3%', quantity: 84, image: '/images/plush-pepe/eggplant.png', telegramLink: 'https://t.me/nft/plushpepe-2426' },
            { name: 'Gummy Frog', rarity: '3%', quantity: 84, image: '/images/plush-pepe/gummy-frog.png', telegramLink: 'https://t.me/nft/plushpepe-2709' },
            { name: 'Hothead', rarity: '3%', quantity: 84, image: '/images/plush-pepe/hothead.png', telegramLink: 'https://t.me/nft/plushpepe-49' },
            { name: 'Hue Jester', rarity: '3%', quantity: 84, image: '/images/plush-pepe/hue-jester.png', telegramLink: 'https://t.me/nft/plushpepe-2079' },
            { name: 'Pepemint', rarity: '3%', quantity: 84, image: '/images/plush-pepe/pepemint.png', telegramLink: 'https://t.me/nft/plushpepe-2485' },
            { name: 'Poison Dart', rarity: '3%', quantity: 84, image: '/images/plush-pepe/poison-dart.png', telegramLink: 'https://t.me/nft/plushpepe-2260' },
            { name: 'Polka Dots', rarity: '3%', quantity: 84, image: '/images/plush-pepe/polka-dots.png', telegramLink: 'https://t.me/nft/plushpepe-2665' },
            { name: 'Pumpkin', rarity: '3%', quantity: 84, image: '/images/plush-pepe/pumpkin.png', telegramLink: 'https://t.me/nft/plushpepe-2367' },
            { name: 'Red Menace', rarity: '3%', quantity: 84, image: '/images/plush-pepe/red-menace.png', telegramLink: 'https://t.me/nft/plushpepe-859' },
            { name: 'Spectrum', rarity: '3%', quantity: 84, image: '/images/plush-pepe/spectrum.png', telegramLink: 'https://t.me/nft/plushpepe-864' },
            { name: 'Tropical', rarity: '3%', quantity: 84, image: '/images/plush-pepe/tropical.png', telegramLink: 'https://t.me/nft/plushpepe-2544' },
            { name: 'Yellow Hug', rarity: '3%', quantity: 84, image: '/images/plush-pepe/yellow-hug.png', telegramLink: 'https://t.me/nft/plushpepe-680' },
            // ← ВСЕ МОДЕЛИ PLUSH PEPE КОНЕЦ →
        ],
        'Precious Peach': [
            // ← ВСЕ 80 МОДЕЛЕЙ PRECIOUS PEACH НАЧАЛО →
            { name: 'Spanked', rarity: '0.2%', quantity: 3, image: '/images/precious-peach/spanked.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-1' },
            { name: 'Smelting', rarity: '0.2%', quantity: 5, image: '/images/precious-peach/smelting.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-2' },
            { name: 'Caramel Red', rarity: '0.2%', quantity: 6, image: '/images/precious-peach/caramel-red.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-3' },
            { name: 'Cherry Secret', rarity: '0.2%', quantity: 6, image: '/images/precious-peach/cherry-secret.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-4' },
            { name: 'Shocking', rarity: '0.2%', quantity: 6, image: '/images/precious-peach/shocking.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-5' },
            { name: 'Angelic', rarity: '0.5%', quantity: 15, image: '/images/precious-peach/angelic.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-6' },
            { name: 'Blizzard', rarity: '0.5%', quantity: 15, image: '/images/precious-peach/blizzard.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-7' },
            { name: 'Bubbling Blue', rarity: '0.5%', quantity: 15, image: '/images/precious-peach/bubbling-blue.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-8' },
            { name: 'Gleam Bite', rarity: '0.5%', quantity: 15, image: '/images/precious-peach/gleam-bite.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-9' },
            { name: 'Impeached', rarity: '0.5%', quantity: 15, image: '/images/precious-peach/impeached.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-10' },
            { name: 'Saint Nickel', rarity: '0.5%', quantity: 15, image: '/images/precious-peach/saint-nickel.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-11' },
            { name: 'Spoiled', rarity: '0.5%', quantity: 15, image: '/images/precious-peach/spoiled.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-12' },
            { name: 'Xmas Lights', rarity: '0.5%', quantity: 15, image: '/images/precious-peach/xmas-lights.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-13' },
            { name: '999 Karat', rarity: '1%', quantity: 29, image: '/images/precious-peach/999-karat.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-14' },
            { name: 'Airy Bright', rarity: '1%', quantity: 29, image: '/images/precious-peach/airy-bright.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-15' },
            { name: 'Bumblebee', rarity: '1%', quantity: 29, image: '/images/precious-peach/bumblebee.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-16' },
            { name: 'Cherry Season', rarity: '1%', quantity: 29, image: '/images/precious-peach/cherry-season.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-17' },
            { name: 'Crypto Orange', rarity: '1%', quantity: 29, image: '/images/precious-peach/crypto-orange.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-18' },
            { name: 'Cutout', rarity: '1%', quantity: 29, image: '/images/precious-peach/cutout.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-19' },
            { name: 'Glass Heart', rarity: '1%', quantity: 29, image: '/images/precious-peach/glass-heart.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-20' },
            { name: 'Jelly Bubble', rarity: '1%', quantity: 29, image: '/images/precious-peach/jelly-bubble.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-21' },
            { name: 'Jelly Stars', rarity: '1%', quantity: 29, image: '/images/precious-peach/jelly-stars.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-22' },
            { name: 'Ladybug', rarity: '1%', quantity: 29, image: '/images/precious-peach/ladybug.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-23' },
            { name: 'Morningstar', rarity: '1%', quantity: 29, image: '/images/precious-peach/morningstar.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-24' },
            { name: 'Mushroom', rarity: '1%', quantity: 29, image: '/images/precious-peach/mushroom.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-25' },
            { name: 'Pink Cupid', rarity: '1%', quantity: 29, image: '/images/precious-peach/pink-cupid.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-26' },
            { name: 'Premium', rarity: '1%', quantity: 29, image: '/images/precious-peach/premium.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-27' },
            { name: 'Rich Green', rarity: '1%', quantity: 29, image: '/images/precious-peach/rich-green.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-28' },
            { name: 'Smooch', rarity: '1%', quantity: 29, image: '/images/precious-peach/smooch.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-29' },
            { name: 'Tonfruit', rarity: '1%', quantity: 29, image: '/images/precious-peach/tonfruit.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-30' },
            { name: 'Yin Yang', rarity: '1%', quantity: 29, image: '/images/precious-peach/yin-yang.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-31' },
            { name: 'Berry Pit', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/berry-pit.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-32' },
            { name: 'Bismuth', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/bismuth.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-33' },
            { name: 'Bright Amber', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/bright-amber.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-34' },
            { name: 'Bright Coral', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/bright-coral.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-35' },
            { name: 'Bronze', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/bronze.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-36' },
            { name: 'Christmas', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/christmas.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-37' },
            { name: 'Clear Sky', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/clear-sky.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-38' },
            { name: 'Cold Iron', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/cold-iron.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-39' },
            { name: 'Cozy Warmth', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/cozy-warmth.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-40' },
            { name: 'Cutie Pink', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/cutie-pink.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-41' },
            { name: 'Dreamer', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/dreamer.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-42' },
            { name: 'Elegance', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/elegance.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-43' },
            { name: 'Faded Silver', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/faded-silver.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-44' },
            { name: 'Fuzzy Lilac', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/fuzzy-lilac.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-45' },
            { name: 'Glossy Pink', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/glossy-pink.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-46' },
            { name: 'Golden Shine', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/golden-shine.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-47' },
            { name: 'Heirloom', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/heirloom.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-48' },
            { name: 'Honey Gold', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/honey-gold.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-49' },
            { name: 'Iridescent', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/iridescent.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-50' },
            { name: 'Iron Blush', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/iron-blush.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-51' },
            { name: 'Juicy Orange', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/juicy-orange.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-52' },
            { name: 'Juicy Tones', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/juicy-tones.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-53' },
            { name: 'Lush Green', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/lush-green.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-54' },
            { name: 'Malachite', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/malachite.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-55' },
            { name: 'Mardi Gras', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/mardi-gras.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-56' },
            { name: 'Morning Haze', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/morning-haze.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-57' },
            { name: 'Moss Posh', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/moss-posh.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-58' },
            { name: 'Neo-Chrome', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/neo-chrome.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-59' },
            { name: 'Party-Ready', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/party-ready.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-60' },
            { name: 'Peach Black', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/peach-black.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-61' },
            { name: 'Polaris', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/polaris.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-62' },
            { name: 'Pure Peach', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/pure-peach.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-63' },
            { name: 'Purple Glow', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/purple-glow.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-64' },
            { name: 'Ripe Green', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/ripe-green.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-65' },
            { name: 'Ruby Red', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/ruby-red.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-66' },
            { name: 'Ruby Slice', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/ruby-slice.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-67' },
            { name: 'Smooth Touch', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/smooth-touch.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-68' },
            { name: 'Soap Bubble', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/soap-bubble.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-69' },
            { name: 'Stardust', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/stardust.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-70' },
            { name: 'Sunset', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/sunset.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-71' },
            { name: 'Terra Firma', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/terra-firma.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-72' },
            { name: 'Twilight', rarity: '1.5%', quantity: 44, image: '/images/precious-peach/twilight.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-73' },
            { name: 'Glossy Finish', rarity: '2%', quantity: 58, image: '/images/precious-peach/glossy-finish.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-74' },
            { name: 'Neptune', rarity: '2%', quantity: 58, image: '/images/precious-peach/neptune.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-75' },
            { name: 'Ogre Green', rarity: '2%', quantity: 58, image: '/images/precious-peach/ogre-green.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-76' },
            { name: 'Pyrite', rarity: '2%', quantity: 58, image: '/images/precious-peach/pyrite.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-77' },
            { name: 'Ripe Pink', rarity: '2%', quantity: 58, image: '/images/precious-peach/ripe-pink.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-78' },
            { name: 'Rosegold', rarity: '2%', quantity: 58, image: '/images/precious-peach/rosegold.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-79' },
            { name: 'Soft Sunset', rarity: '2%', quantity: 58, image: '/images/precious-peach/soft-sunset.jpg', telegramLink: 'https://t.me/nft/PreciousPeach-80' }
            // ← ВСЕ 80 МОДЕЛЕЙ PRECIOUS PEACH КОНЕЦ →
        ],
        "Durov's Cap": [
            // ← ВСЕ МОДЕЛИ DUROV'S CAP НАЧАЛО (53 модели) →
            { name: 'Asterix', rarity: '0.5%', quantity: 23, image: '/images/durovs-cap/asterix.jpg', telegramLink: 'https://t.me/nft/DurovsCap-1' },
            { name: 'Artwork', rarity: '1%', quantity: 47, image: '/images/durovs-cap/artwork.jpg', telegramLink: 'https://t.me/nft/DurovsCap-2' },
            { name: 'RGB Glitch', rarity: '1%', quantity: 47, image: '/images/durovs-cap/rgb-glitch.jpg', telegramLink: 'https://t.me/nft/DurovsCap-3' },
            { name: 'Captain', rarity: '1.5%', quantity: 70, image: '/images/durovs-cap/captain.jpg', telegramLink: 'https://t.me/nft/DurovsCap-4' },
            { name: 'Cartoon', rarity: '1.5%', quantity: 70, image: '/images/durovs-cap/cartoon.jpg', telegramLink: 'https://t.me/nft/DurovsCap-5' },
            { name: 'Cotton Candy', rarity: '1.5%', quantity: 70, image: '/images/durovs-cap/cotton-candy.jpg', telegramLink: 'https://t.me/nft/DurovsCap-6' },
            { name: 'Falcon', rarity: '1.5%', quantity: 70, image: '/images/durovs-cap/falcon.jpg', telegramLink: 'https://t.me/nft/DurovsCap-7' },
            { name: 'Fun Time', rarity: '1.5%', quantity: 70, image: '/images/durovs-cap/fun-time.jpg', telegramLink: 'https://t.me/nft/DurovsCap-8' },
            { name: 'Honey Bee', rarity: '1.5%', quantity: 70, image: '/images/durovs-cap/honey-bee.jpg', telegramLink: 'https://t.me/nft/DurovsCap-9' },
            { name: 'Jetspin', rarity: '1.5%', quantity: 70, image: '/images/durovs-cap/jetspin.jpg', telegramLink: 'https://t.me/nft/DurovsCap-10' },
            { name: 'Neon', rarity: '1.5%', quantity: 70, image: '/images/durovs-cap/neon.jpg', telegramLink: 'https://t.me/nft/DurovsCap-11' },
            { name: 'Redrum', rarity: '1.5%', quantity: 70, image: '/images/durovs-cap/redrum.jpg', telegramLink: 'https://t.me/nft/DurovsCap-12' },
            { name: 'Snowfall', rarity: '1.5%', quantity: 70, image: '/images/durovs-cap/snowfall.jpg', telegramLink: 'https://t.me/nft/DurovsCap-13' },
            { name: 'Toxic Guy', rarity: '1.5%', quantity: 70, image: '/images/durovs-cap/toxic-guy.jpg', telegramLink: 'https://t.me/nft/DurovsCap-14' },
            { name: 'Tron', rarity: '1.5%', quantity: 70, image: '/images/durovs-cap/tron.jpg', telegramLink: 'https://t.me/nft/DurovsCap-15' },
            { name: 'Voltage', rarity: '1.5%', quantity: 70, image: '/images/durovs-cap/voltage.jpg', telegramLink: 'https://t.me/nft/DurovsCap-16' },
            { name: 'Apple Slice', rarity: '2%', quantity: 94, image: '/images/durovs-cap/apple-slice.jpg', telegramLink: 'https://t.me/nft/DurovsCap-17' },
            { name: 'Ashen', rarity: '2%', quantity: 94, image: '/images/durovs-cap/ashen.jpg', telegramLink: 'https://t.me/nft/DurovsCap-18' },
            { name: 'Aurora', rarity: '2%', quantity: 94, image: '/images/durovs-cap/aurora.jpg', telegramLink: 'https://t.me/nft/DurovsCap-19' },
            { name: 'Autumn', rarity: '2%', quantity: 94, image: '/images/durovs-cap/autumn.jpg', telegramLink: 'https://t.me/nft/DurovsCap-20' },
            { name: 'Bluebird', rarity: '2%', quantity: 94, image: '/images/durovs-cap/bluebird.jpg', telegramLink: 'https://t.me/nft/DurovsCap-21' },
            { name: 'Bog Moss', rarity: '2%', quantity: 94, image: '/images/durovs-cap/bog-moss.jpg', telegramLink: 'https://t.me/nft/DurovsCap-22' },
            { name: 'Bordeaux', rarity: '2%', quantity: 94, image: '/images/durovs-cap/bordeaux.jpg', telegramLink: 'https://t.me/nft/DurovsCap-23' },
            { name: 'Candy Shade', rarity: '2%', quantity: 94, image: '/images/durovs-cap/candy-shade.jpg', telegramLink: 'https://t.me/nft/DurovsCap-24' },
            { name: 'Chicago Bulls', rarity: '2%', quantity: 94, image: '/images/durovs-cap/chicago-bulls.jpg', telegramLink: 'https://t.me/nft/DurovsCap-25' },
            { name: 'Classic', rarity: '2%', quantity: 94, image: '/images/durovs-cap/classic.jpg', telegramLink: 'https://t.me/nft/DurovsCap-26' },
            { name: 'Corkwood', rarity: '2%', quantity: 94, image: '/images/durovs-cap/corkwood.jpg', telegramLink: 'https://t.me/nft/DurovsCap-27' },
            { name: 'Creamsicle', rarity: '2%', quantity: 94, image: '/images/durovs-cap/creamsicle.jpg', telegramLink: 'https://t.me/nft/DurovsCap-28' },
            { name: 'Dipper', rarity: '2%', quantity: 94, image: '/images/durovs-cap/dipper.jpg', telegramLink: 'https://t.me/nft/DurovsCap-29' },
            { name: 'Duck Tales', rarity: '2%', quantity: 94, image: '/images/durovs-cap/duck-tales.jpg', telegramLink: 'https://t.me/nft/DurovsCap-30' },
            { name: 'Duskwave', rarity: '2%', quantity: 94, image: '/images/durovs-cap/duskwave.jpg', telegramLink: 'https://t.me/nft/DurovsCap-31' },
            { name: 'Freshwave', rarity: '2%', quantity: 94, image: '/images/durovs-cap/freshwave.jpg', telegramLink: 'https://t.me/nft/DurovsCap-32' },
            { name: 'Frosted Brew', rarity: '2%', quantity: 94, image: '/images/durovs-cap/frosted-brew.jpg', telegramLink: 'https://t.me/nft/DurovsCap-33' },
            { name: 'Frosthorn', rarity: '2%', quantity: 94, image: '/images/durovs-cap/frosthorn.jpg', telegramLink: 'https://t.me/nft/DurovsCap-34' },
            { name: 'Goldrose', rarity: '2%', quantity: 94, image: '/images/durovs-cap/goldrose.jpg', telegramLink: 'https://t.me/nft/DurovsCap-35' },
            { name: 'Ivory', rarity: '2%', quantity: 94, image: '/images/durovs-cap/ivory.jpg', telegramLink: 'https://t.me/nft/DurovsCap-36' },
            { name: 'Jade', rarity: '2%', quantity: 94, image: '/images/durovs-cap/jade.jpg', telegramLink: 'https://t.me/nft/DurovsCap-37' },
            { name: 'Krueger', rarity: '2%', quantity: 94, image: '/images/durovs-cap/krueger.jpg', telegramLink: 'https://t.me/nft/DurovsCap-38' },
            { name: 'Macintosh', rarity: '2%', quantity: 94, image: '/images/durovs-cap/macintosh.jpg', telegramLink: 'https://t.me/nft/DurovsCap-39' },
            { name: 'Mossy', rarity: '2%', quantity: 94, image: '/images/durovs-cap/mossy.jpg', telegramLink: 'https://t.me/nft/DurovsCap-40' },
            { name: 'Negative', rarity: '2%', quantity: 94, image: '/images/durovs-cap/negative.jpg', telegramLink: 'https://t.me/nft/DurovsCap-41' },
            { name: 'Night Ivy', rarity: '2%', quantity: 94, image: '/images/durovs-cap/night-ivy.jpg', telegramLink: 'https://t.me/nft/DurovsCap-42' },
            { name: 'Nightshade', rarity: '2%', quantity: 94, image: '/images/durovs-cap/nightshade.jpg', telegramLink: 'https://t.me/nft/DurovsCap-43' },
            { name: 'Patriot', rarity: '2%', quantity: 94, image: '/images/durovs-cap/patriot.jpg', telegramLink: 'https://t.me/nft/DurovsCap-44' },
            { name: 'Pink Pop', rarity: '2%', quantity: 94, image: '/images/durovs-cap/pink-pop.jpg', telegramLink: 'https://t.me/nft/DurovsCap-45' },
            { name: 'Pinkie Cap', rarity: '2%', quantity: 94, image: '/images/durovs-cap/pinkie-cap.jpg', telegramLink: 'https://t.me/nft/DurovsCap-46' },
            { name: 'Pokemon', rarity: '2%', quantity: 94, image: '/images/durovs-cap/pokemon.jpg', telegramLink: 'https://t.me/nft/DurovsCap-47' },
            { name: 'Sea Sunset', rarity: '2%', quantity: 94, image: '/images/durovs-cap/sea-sunset.jpg', telegramLink: 'https://t.me/nft/DurovsCap-48' },
            { name: 'Seabreeze', rarity: '2%', quantity: 94, image: '/images/durovs-cap/seabreeze.jpg', telegramLink: 'https://t.me/nft/DurovsCap-49' },
            { name: 'Sepium', rarity: '2%', quantity: 94, image: '/images/durovs-cap/sepium.jpg', telegramLink: 'https://t.me/nft/DurovsCap-50' },
            { name: 'Shadeux', rarity: '2%', quantity: 94, image: '/images/durovs-cap/shadeux.jpg', telegramLink: 'https://t.me/nft/DurovsCap-51' },
            { name: 'Shadow', rarity: '2%', quantity: 94, image: '/images/durovs-cap/shadow.jpg', telegramLink: 'https://t.me/nft/DurovsCap-52' },
            { name: 'Sky High', rarity: '2%', quantity: 94, image: '/images/durovs-cap/sky-high.jpg', telegramLink: 'https://t.me/nft/DurovsCap-53' },
            { name: 'Sunrise', rarity: '2%', quantity: 94, image: '/images/durovs-cap/sunrise.jpg', telegramLink: 'https://t.me/nft/DurovsCap-54' },
            { name: 'Villager', rarity: '2%', quantity: 94, image: '/images/durovs-cap/villager.jpg', telegramLink: 'https://t.me/nft/DurovsCap-55' }
            // ← ВСЕ МОДЕЛИ DUROV'S CAP КОНЕЦ →
        ]
    };
    
    // Берем набор для текущей коллекции или создаем общий
    const modelSet = modelSets[giftTitle] || [
        { name: 'Элитная модель', rarity: '0.5%', quantity: 10 },
        { name: 'Редкая модель', rarity: '5%', quantity: 50 },
        { name: 'Обычная модель', rarity: '94.5%', quantity: 2940 }
    ];
    
   modelSet.forEach((item, index) => {
    const modelId = item.name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/gi, '');
    
    // ВАЖНО: Берем ТОЛЬКО данные из массива, без генерации
    // Если в массиве нет telegramLink - будет undefined
    models.push({
        id: modelId,
        name: item.name,
        rarity: item.rarity,
        quantity: item.quantity,
        image: item.image || `/images/collection/${modelId}.jpg`,
        telegramLink: item.telegramLink, // ТОЛЬКО из данных, без генерации
        description: item.description || `Модель ${item.name}`
    });
});
    
    // Подсчет общей статистики
    const totalModels = models.length;
    const totalStock = models.reduce((sum, model) => sum + parseInt(model.quantity), 0);
    
    console.log(`Создано ${totalModels} моделей для коллекции ${giftTitle}`);
    console.log(`Общее количество штук: ${totalStock}`);
    
    return models;
}

function generateTelegramLink(collectionName, modelName) {
    const collectionId = collectionName.toLowerCase()
        .replace(/['\s]+/g, '')
        .replace('pepe', 'Pepe')
        .replace('peach', 'Peach');
    
    const modelId = modelName.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/gi, '');
    
    const randomNum = Math.floor(Math.random() * 10000);
    
    return `https://t.me/nft/${collectionId}-${modelId}-${randomNum}`;
}

module.exports = router;