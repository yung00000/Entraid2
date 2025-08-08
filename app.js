const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('express-flash');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config();

// 数据库连接
const db = require('./database/db');

// 策略配置
const entraStrategy = require('./auth/entraStrategy');
const googleStrategy = require('./auth/googleStrategy');
const localStrategy = require('./auth/localStrategy');

// 路由
const authRoutes = require('./routes/authRoutes');
const webRoutes = require('./routes/webRoutes');

// 创建 Express 应用
const app = express();

// 设置视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 中间件
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(flash());

// 会话配置
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // 开发环境用false，生产环境用true
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));

// Passport 初始化
app.use(passport.initialize());
app.use(passport.session());

// Passport 序列化
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    done(err, user);
  });
});

// 注册策略
passport.use('entra-id', entraStrategy);
passport.use('google', googleStrategy);
passport.use('local', localStrategy);

// 路由
app.use('/auth', authRoutes);
app.use('/', webRoutes);

// 启动服务器
const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});