var fs = require('fs');
var path = require('path');
var https = require('https');
var logger = require('morgan');
const chalk = require('chalk'); // 控制台输出颜色字体
var express = require('express');
var createError = require('http-errors');
var cookieParser = require('cookie-parser');

var BaseUrl = '/api/v1'; // 初始URL
var indexRouter = require('./routes/index');
var loginRouter = require('./routes/Login');
var authRouter = require('./routes/Auth');

var util = require('./util');

var app = express();

// require('./module/snkrsBot'); // 引入snkrs商品脚本，定时器

// 开启全部跨域
app.all('*', function (req, res, next) {
    // res.header('Access-Control-Allow-Origin', "http://localhost:8080");
    res.header('Access-Control-Allow-Origin', "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header('Access-Control-Allow-Credentials', true);
    next();
});

// 需要跳过检查jwt的接口
const skipList = require('./config/skipInterface.config');

// 设置接口的拦截器，除login都需要验证token信息
app.use(function (req, res, next) {
    let flag = null;
    try {
        if (req.originalUrl.split('?')[0].indexOf('/api/v1') === -1) { // 不为接口文件时直接跳过
            flag = true;
        } else {
            skipList.forEach(item => {
                // 当存在需要跳过的接口时，更改标记，并跳出循环 
                if (req.originalUrl.split('?')[0] === item) { // split为了避免是url传递参数导致无法进入路由判断
                    flag = true;
                    throw new Error();
                } else {
                    flag = false;
                }
            });
        }
    } catch (err) { }

    if (flag) { // 为符合的接口直接跳过
        next();
    } else {
        if (!req.headers['x-auth']) { // 当不存在时，只包含''，null和undefined不含在内
            res.sendStatus(412);
        } else { // 存在才验证
            // 调用jwt验证方法，符合next，不符合401返回
            let username = util.decodedJwt(req.headers['x-auth'])[2];
            if (util.decodedJwt(req.headers['x-auth']) && Date.now() < global.userExptimeList[username]) { // 解析jwt合法并且在用户数组中当前时间小于用户登陆时间则通过
                next();
            } else { // 鉴权失败
                res.sendStatus(401);
            }
        };
    }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(BaseUrl + '/', indexRouter);
app.use(BaseUrl + '/login', loginRouter);
app.use(BaseUrl + '/auth', authRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

//  ----- 设置https -----
const options = {
    pfx: fs.readFileSync(path.join(__dirname, 'public', 'certificate', 'zh186.cn.pfx')),
    passphrase: 'x18q1q9abjs'
};

let server = https.createServer(options, app);
const SERVER_PORT = '3001';
server.listen(SERVER_PORT, () => {
    console.log(chalk.green(`https服务已经启动，监听端口${SERVER_PORT}`))
});
// --- 设置http send ---

module.exports = app;