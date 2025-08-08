




const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { strategy, sessionConfig, serializeUser, deserializeUser } = require('./authConfig');
const app = express();

// 设置视图引擎为EJS
app.set('view engine', 'ejs');

// 中间件
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// 序列化设置
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);
passport.use(strategy);

// 中间件：记录请求信息（调试用）
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Auth: ${req.isAuthenticated()}`);
  next();
});

// 路由：首页
app.get('/', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.render('index', { 
    user: req.user,
    sessionID: req.sessionID // 用于调试
  });
});

// 路由：登录
app.get('/login', (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  passport.authenticate('azuread-openidconnect', {
    failureRedirect: '/login-failed',
    failureFlash: true
  })(req, res, next);
});

// 路由：登录回调（Entra ID回调到这里）
app.post('/auth/openid/return', 
  passport.authenticate('azuread-openidconnect', {
    failureRedirect: '/login-failed',
    failureFlash: true
  }),
  (req, res) => {
    // 认证成功，重定向到首页
    res.redirect('/');
  }
);

// 路由：登录失败
app.get('/login-failed', (req, res) => {
  const errorMessage = req.flash('error')[0] || '未知错误';
  res.render('login-failed', { error: errorMessage });
});

// 路由：登出
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('登出错误:', err);
      return res.status(500).send('登出失败');
    }
    // 销毁会话
    req.session.destroy((err) => {
      if (err) console.error('会话销毁错误:', err);
      // 重定向到Entra ID登出端点
      const logoutUrl = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(process.env.POST_LOGOUT_REDIRECT_URI)}`;
      res.redirect(logoutUrl);
    });
  });
});

// 启动服务器
const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});