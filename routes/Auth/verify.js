const router = require('./index');
const util = require('../../util');

// 接口只需要接受token即可（6位随机数）
router.get('/verify', async (req, res, next) => {
    let verified = await verify({
        username: util.decodedJwt(req.headers['x-auth'])['2'], // 从请求头的jwt中获取用户名
        token: req.query.token
    });

    res.send(verified);
});

/**
 * 验证谷歌令牌
 * @param {object} - username 用户名
 *                 - token 每分钟随机生成的code
 * @returns {object} - 返回结果
*/
const verify = function (data) {
    const speakeasy = require('speakeasy');
    const mysql = require('../../module/linkMysql');

    return mysql.query(`SELECT * FROM userinfo WHERE username = '${data.username}'`).then(response => {
        if (response.code === 1) {
            return {
                code: 1,
                data: speakeasy.totp.verify({
                    secret: response.data[0].authSecret, // 密钥
                    encoding: 'base32',
                    token: data.token // 随机生成code 6位
                }),
                msg: '成功'
            }
        } else {
            return {
                code: 0,
                data: {},
                msg: "服务器错误"
            };

        }
    });
};

module.exports = {
    verify
};