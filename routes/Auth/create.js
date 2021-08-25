const router = require('./index');
const util = require('../../util');
const mysql = require('../../module/linkMysql');

router.post('/create', (req, res, next) => {
    let userInfo = util.decodedJwt(req.headers['x-auth']); // 根据请求头的令牌解析出用户信息
    let username = userInfo['2'];

    const speakeasy = require('speakeasy');
    let speakeasy_name = 'Zh186.cn';
    let secret = speakeasy.generateSecret({ length: 20, name: `${speakeasy_name} (${username})` });

    mysql.query(`SELECT * FROM userinfo WHERE username = '${username}'`).then(response => {
        if (response.code === 1) {
            if (response.data[0].authSecret === null || response.data[0].authSecret === '' || response.data[0].authSecret === undefined) { // 此用户从未绑定过令牌
                console.log('该用户未绑定过令牌');
                mysql.query(`UPDATE userinfo SET authSecret = '${secret.base32}' WHERE username = ${username}`).then(response_1 => { // 改变数据库中authSecret的值
                    if (response_1.code === 1 && response_1.data.changedRows >= 1) { // 当响应成功，并且影响行数大于等于1时
                        util.qrCode(secret.otpauth_url).then(url => {
                            res.send({
                                code: 1,
                                data: { baseImg: url },
                                msg: '成功'
                            });
                        }, (err) => {
                            res.send({
                                data: {},
                                msg: '二维码生成失败',
                                code: 0
                            });
                            console.log('ERROR - {method:post,address:"/auth/create",id:1}');
                        });
                    } else {
                        res.send({
                            code: 0,
                            data: {},
                            msg: ''
                        });
                        console.log('ERROR - {method:post,address:"/auth/create",id:2}');
                    }
                }, err => {
                    res.send({
                        data: {},
                        msg: '数据库添加二维码失败',
                        code: 0
                    });
                    console.log('ERROR - {method:post,address:"/auth/create",id:3}');
                });
            } else {
                console.log('该用户绑定过令牌');
                // 对于绑定过令牌的，直接从数据库中找到密钥然后拼接生成二维码
                util.qrCode(`otpauth://totp/${speakeasy_name}%20(${response.data[0].username})?secret=${response.data[0].authSecret}`).then(url => {
                    res.send({
                        code: 1,
                        data: { baseImg: url },
                        msg: '成功'
                    });
                }, (err) => {
                    res.send({
                        data: {},
                        msg: '二维码生成失败',
                        code: 0
                    });
                    console.log('ERROR - {method:post,address:"/auth/create",id:4}');
                });
            }
        } else {
            res.send({
                code: 0,
                data: {},
                msg: "服务器错误"
            });
        }
    });
});