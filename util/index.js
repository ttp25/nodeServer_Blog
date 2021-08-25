const axios = require('axios'); // axios 进行http请求
const chalk = require('chalk'); // 优化控制台输出(可设置颜色)
const crypto = require('crypto'); // 生成md5需要
const jwt = require('jsonwebtoken'); // 生成jwt鉴权使用
const qrcode = require('qrcode'); // 生成二维码使用

const log = console.log;
const jwtConfig = require('../config/jsonWebToken.config');
const postMessage = require('./postMessage');

/**
 * 生成JsonWebToken用于鉴权
 */
const createJwt = function (data) {
    let now = new Date();
    now.setHours(now.getHours() + jwtConfig.expHours);
    let exp = Math.floor(now.getTime() / 1000); // 取秒数    expiration time 过期时间

    const payload = {
        1: data.name,
        2: data.username,
        iss: "https://www.zh186.cn",
        exp
    }
    const secret = jwtConfig.secret; // 私钥
    const token = jwt.sign(payload, secret); // 签发

    return token;
};

/**
 * 解析JsonWebToken
 * @param {string} token - jwt
 * @returns {boolean} - 是否符合jwt格式验证
 */
const decodedJwt = function (token) {
    return jwt.verify(token, jwtConfig.secret, (err, decoded) => {
        if (err) {
            log(chalk.red(`ERROR - fn:${arguments.callee.name}`));
            return false;
        }
        return decoded;
    })
};

/**
 * 根据传入参数生成对应32位MD5，默认转为大写
 * @param {any} - 需转换的参数
 * @returns {string} - 对应的MD5
 */
const createMd5 = function (data) {
    return crypto.createHash('md5').update(data).digest('hex').toUpperCase();
};

const qrCode = (data) => {
    return new Promise((resolve, reject) => {
        qrcode.toDataURL(data, (err, url) => {
            if (err) {
                log(chalk.red(`ERROR - fn:${arguments.callee.name}`));
                reject();
            }
            resolve(url);
        })
    });
};

// 开启控制台打印
const nodeMonkey = function () {
    const NodeMonkey = require("node-monkey");
    NodeMonkey({
        server: {
            server: null, //指定已存在的服务器
            host: '127.0.0.1', //指定IP地址
            port: 4455, //指定端口
            silent: false,
            bufferSize: 50, //缓冲区的大小
            disableLocalOutput: true //禁止本地输出，即终端输出
        }
    });
};

module.exports = {
    postMessage,
    createMd5,
    createJwt,
    decodedJwt,
    nodeMonkey,
    qrCode
};