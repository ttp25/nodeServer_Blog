const axios = require('axios');
const postMsgConfig = require('../config/postMessage.config');
const log = console.log;
const chalk = require('chalk');

/**
 * 向手机端发送消息通知 -- 仅限iphone，依赖Bark进行推送
 * @param {object} config - 发送配置项
 * @param {object} data - 发送内容
 */
const postMessage = function (config = { type: 'onlyMsg', sound: false, isArchive: false, group: '', url: '', copy: false }, data = { title: 'postMessage初始状态', message: 'none' }) {
    let BaseUrl = postMsgConfig.BaseUrl;
    let msgConfig = '?';
    let msgUrl = '';
    let dict = [{
        key: 'sound',
        value: config.sound
    }, {
        key: 'isArchive',
        value: config.isArchive
    }, {
        key: 'group',
        value: config.group
    }, {
        key: 'url',
        value: config.url
    }, {
        key: 'copy',
        value: config.copy
    }];

    if (config.type === 'onlyMsg') {
        BaseUrl += encodeURI(data.message);
    } else if (config.type === 'title') {
        BaseUrl += encodeURI(data.title) + '/' + encodeURI(data.message)
    }

    dict.forEach(item => {
        if (item.value) {
            msgConfig += `${item.key}=${item.value}&`;
        }
    });

    if (msgConfig.length > 1) {
        msgConfig = msgConfig.slice(0, -1); // 去除末尾的拼接符
        msgUrl = BaseUrl + msgConfig;
    } else {
        msgUrl = BaseUrl;
    }

    axios.get(msgUrl).then(response => {
        if (response.data.code === 200) {
            log(chalk.yellow('消息推送成功！'));
        } else {
            log(chalk.red('消息推送失败！' + response.data));
        }
    }, error => {
        log(chalk.red('消息推送失败！可能是日期格式使用了/拼接导致'));
    });
};

module.exports = postMessage;