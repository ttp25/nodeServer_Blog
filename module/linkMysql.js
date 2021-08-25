const serverConfig = require('../config/server.config');

/** 连接数据库查询SQL语句
 * @method query
 * @param {String} sql -- sql语句
 * @param {Object} res -- 响应对象
 */
function query(sql, res) {
    return new Promise((resolve, reject) => {
        const mysql = require('mysql');

        //数据库信息
        const mysqlInfo = mysql.createConnection({
            host: serverConfig.ip,
            user: serverConfig.database.user,
            password: serverConfig.database.password,
            database: serverConfig.database.database
        });

        mysqlInfo.connect(); //建立连接

        mysqlInfo.query(sql, function (error, result) {
            let resObj
            if (error) {
                resObj = {
                    code: -1,
                    data: {},
                    msg: 'ERROR:查询语句有误',
                };
                reject(resObj);
                return;
            }

            resObj = {
                code: 1,
                data: result,
                msg: '成功',
            };

            if (result.length < 1) {
                resObj.code = 0;
                resObj.msg = '未查询到此条件数据';
            }
            resolve(resObj);
        });
        mysqlInfo.end();
    });
};

module.exports = {
    query
};