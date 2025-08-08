const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User'); // 添加这行导入

// Entra ID 登录
router.get('/entra', passport.authenticate('entra-id'));
router.post('/entra/callback', 
  passport.authenticate('entra-id', { 
    failureRedirect: '/login-failed',
    failureFlash: true 
  }),
  (req, res) => {
    res.redirect('/');
  }
);

// Google 登录
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login-failed',
    failureFlash: true 
  }),
  (req, res) => {
    res.redirect('/');
  }
);

// 本地注册
router.post('/register', (req, res) => {
  const { email, password, displayName, confirmPassword } = req.body;
  
  // 验证输入
  if (!email || !password || !displayName) {
    req.flash('error', '所有字段都必须填写');
    return res.redirect('/register');
  }
  
  // 验证密码匹配
  if (password !== confirmPassword) {
    req.flash('error', '两次输入的密码不匹配');
    return res.redirect('/register');
  }

  // 检查邮箱是否已注册
  User.findByEmail(email, (err, user) => {
    if (err) {
      console.error('注册错误:', err);
      req.flash('error', '服务器错误');
      return res.redirect('/register');
    }

    if (user) {
      req.flash('error', '该邮箱已被注册');
      return res.redirect('/register');
    }

    // 创建新用户
    User.create({
      email,
      password,
      displayName,
      provider: 'local'
    }, (err, user) => {
      if (err) {
        console.error('创建用户错误:', err);
        req.flash('error', '注册失败');
        return res.redirect('/register');
      }

      // 自动登录新用户
      req.login(user, (err) => {
        if (err) {
          console.error('自动登录错误:', err);
          req.flash('error', '自动登录失败，请手动登录');
          return res.redirect('/login');
        }
        res.redirect('/');
      });
    });
  });
});

// 本地登录
router.post('/login', 
  passport.authenticate('local', { 
    failureRedirect: '/login', 
    failureFlash: true 
  }),
  (req, res) => {
    res.redirect('/');
  }
);

// 登出
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('登出错误:', err);
      return res.status(500).send('登出失败');
    }
    
    // 销毁会话
    req.session.destroy((err) => {
      if (err) console.error('会话销毁错误:', err);
      
      // 根据提供者重定向到不同的登出端点
      let logoutUrl = '/';
      
      if (req.user && req.user.provider === 'entra-id') {
        logoutUrl = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(process.env.POST_LOGOUT_REDIRECT_URI)}`;
      }
      
      res.redirect(logoutUrl);
    });
  });
});

module.exports = router;