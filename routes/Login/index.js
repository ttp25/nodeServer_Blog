const express = require('express');
const router = express.Router();

const util = require('../../util');
const mysql = require('../../module/linkMysql');
const chalk = require('chalk'); // 优化控制台输出(可设置颜色)
const getAddress = require('../../util/getAddress');
const speakeasy = require('speakeasy');

global.userExptimeList = {}; // 存放用户过期时间数据
const expTime = 1; // 用户token有效时间（分钟）

router.post('/', function (req, res, next) {
    let body = req.body;
    let flag = true;
    let response = {
        code: 0,
        data: {},
        msg: ''
    };

    const dict = [
        { key: 'username', msg: '用户名不可为空' },
        { key: 'password', msg: '密码不可为空' }
    ];

    dict.forEach(item => {
        if (body[item.key] === undefined || body[item.key] === null || body[item.key] === '') {
            response.msg += item.msg + ',';
            flag = false;
        }
    });

    if (!flag) {
        response.msg = response.msg.slice(0, -1);
        res.send(response);
        return;
    }

    // 数据库查询是否有符合的用户名、密码、密钥
    mysql.query(`SELECT * FROM userinfo WHERE username = '${body.username}' AND password = '${body.password}'`).then(async function (response) {
        if (response.code === 1) {
            if (response.data[0].authSecret !== "") {
                // 当用户已经绑定过令牌
                if (body.auth !== '') {
                    // 开始验证令牌
                    let authVerify = speakeasy.totp.verify({
                        secret: response.data[0].authSecret, // 密钥
                        encoding: 'base32',
                        token: body.auth // 随机生成code 6位
                    })

                    if (authVerify) { // 通过验证
                        res.send({
                            code: 1,
                            data: {
                                token: util.createJwt(response.data[0])
                            },
                            msg: '成功'
                        });
                    } else {
                        res.send({
                            code: 0,
                            data: {},
                            msg: 'auth验证失败'
                        });
                    }

                } else {
                    // 当auth为空时
                    res.send({
                        code: 0,
                        data: {},
                        msg: '授权不可为空'
                    });
                }
            } else {
                console.log('未绑定通过');
                // 未绑定令牌时，只要用户名和密码一致即可通过
                res.send({
                    code: 1,
                    data: {
                        token: util.createJwt(response.data[0])
                    },
                    msg: '成功'
                });
            }

            // ================= 向手机推送消息 =================
            // let date = new Date().toLocaleString().replace(/['上午','下午']/g, '');
            // date = date.replace(/\//g, '-');

            // let addressInfo = {}; // 地址信息集合
            // await getAddress.getInfoByIp(req.ip.split('f:')[1]).then(res => {
            //     addressInfo.isp = res.isp; // 运营商
            //     addressInfo.location = res.location; // 经纬度
            // });

            // if (addressInfo.location !== ',') { // 经纬度信息不为空则推送详细地址信息
            //     await getAddress.getInfoByLocation(addressInfo.location).then(res => {
            //         addressInfo.country = res?.country + ',';
            //         addressInfo.province = res?.province + ',';
            //         addressInfo.city = res?.city + ',';
            //         addressInfo.district = res?.district + ',';
            //         addressInfo.township = res?.township + ',';
            //         addressInfo.formatted_address = res?.formatted_address;
            //     });
            //     util.postMessage({ type: 'title', sound: 'minuet' }, {
            //         title: 'Blog系统登入预警',
            //         message: `登入时间:${date},访问ip:${req.ip.split('f:')[1]},运营商:${addressInfo.isp},ip信息:${addressInfo.country}${addressInfo.province}${addressInfo.city}${addressInfo.district}${addressInfo.township}${addressInfo.formatted_address},定位:${addressInfo.location}`
            //     }); // 登陆成功发送登陆预警
            // } else {
            //     util.postMessage({ type: 'title', sound: 'minuet' }, {
            //         title: 'Blog系统登入预警',
            //         message: `登入时间:${date},访问ip:${req.ip.split('f:')[1]}`
            //     }); // 登陆成功发送登陆预警
            // }
            // ================= 向手机推送消息 end =================

            global.userExptimeList[body.username] = Math.floor((Date.now() + (expTime * 60 * 1000))); // 登陆成功将用户数据和过期时间存入数组中，相比存入数据库要快的多
        } else {
            res.send({
                code: 0,
                data: {},
                msg: '帐号或密码错误，请重新输入'
            });
        }
    }, error => {
        res.send(error);
    });
});

module.exports = router;