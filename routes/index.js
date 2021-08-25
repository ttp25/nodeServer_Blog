var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/expInfo', function (req, res, next) { // 获取用户过期时间列表
    if (JSON.stringify(req.query) !== '{}') {
        if (req.query.user === 'zh' && req.query.pwd === '630478') {
            res.send(global.userExptimeList);
        } else {
            res.sendStatus(401);
        }
    } else {
        res.sendStatus(412);
    }
});

router.get('/ip', async (req, res, next) => {
    const getAddress = require('../util/getAddress');
    let addressByIp = await getAddress.getInfoByIp(req.ip.split('f:')[1]);
    let addressByLocation = await getAddress.getInfoByLocation(addressByIp.location);
    let body
    try {
        body = {
            ip: req.ip.split('f:')[1],
            address: {
                country: addressByLocation.country,
                province: addressByLocation.province,
                city: addressByLocation.city,
                district: addressByLocation.district,
                township: addressByLocation.township,
                formatted_address: addressByLocation.formatted_address,
                ip: addressByIp.ip,
                isp: addressByIp.isp,
                location: addressByIp.location
            }
        };
    } catch (err) {
        console.log('ERROR - {method:get,address:"/ip"}');
        body = { msg: '服务器异常' };
    }
    res.send(body);
});

router.post('/snkrs', (req, res, next) => {
    const http = require('axios');

    getCargo(req.body.type, req.body.config).then(response => {
        res.send(response);
    });

    async function getCargo(type = 'all', config) {
        type = type?.toUpperCase();
        let byName = false;
        let byTitle = false;
        let byAll = false;

        switch (type) {
            case 'ALL': byAll = true; break;
            case 'BYNAME': byName = true; config.name = config.name.toUpperCase(); break;
            case 'BYTITLE': byTitle = true; config.title = config.title.toUpperCase(); break;
        };

        const cargoList = [];
        let snkrs_index = await $get('https://api.nike.com/snkrs/content/v1/?&country=CN&language=zh-Hans&offset=0&orderBy=published');

        let threads = snkrs_index.threads;

        try {
            threads.forEach(item => {
                let data = {};
                data.name = item.name;
                data.title = item.title;
                data.restricted = item.restricted; // 是否受限，true则不显示
                data.imageUrl = item.imageUrl;
                data.squareImageUrl = item.squareImageUrl; // 方形图

                let product = item.product;
                data.ArtNo = product.style + '-' + product.colorCode; // 货号
                data.quantityLimit = product.quantityLimit; // 下单数量限制
                data.colorDescription = product.colorDescription; // 颜色
                data.available = product.available; // 可否获得，false则不可获得
                data.publishType = product.publishType; // 发售方式
                data.productType = product.productType; // 商品类型
                data.upcoming = product.upcoming; // 即将来临
                data.price = product.price?.msrp; // 价格 --> 建议零售价
                data.startSellDate = new Date(product.startSellDate?.replace(/T/, ' ')?.replace(/.000000/, ' GMT'))?.toLocaleString(); // 开始时间

                let skus = [];
                product.skus?.forEach(sku => {
                    skus.push({
                        size: sku.localizedSize,
                        available: sku.available // false 为不受限可以购买，true 受限不可购买
                    });
                });
                data.skus = skus;

                if (byAll) {
                    cargoList.push(data);
                } else if (data.name.toUpperCase().indexOf(config.name) !== -1 && byName) {
                    cargoList.push(data);
                } else if (data.title.toUpperCase().indexOf(config.title) !== -1 && byTitle) {
                    cargoList.push(data);
                };

            });
        } catch (err) { }

        return cargoList;
    };

    function $get(url) {
        return new Promise((resolve, reject) => {
            console.log(`method:get,data:{url:${url}}`);
            let getRes = http.get(url);
            getRes.then(response => {
                resolve(response.data);
            }, err => {
                reject(err);
            });
        });
    };
});

router.get('/urlchange', async (req, res, next) => {
    console.log(req.query);

    res.send('ok');
});

module.exports = router;