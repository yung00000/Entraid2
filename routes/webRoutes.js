const express = require('express');
const router = express.Router();

// 主页
router.get('/', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  
  // 根据用户来源显示不同信息
  let providerName = '';
  switch (req.user.provider) {
    case 'entra-id':
      providerName = 'Microsoft Entra ID';
      break;
    case 'google':
      providerName = 'Google';
      break;
    default:
      providerName = '邮箱注册';
  }
  
  res.render('index', { 
    user: req.user,
    providerName,
    sessionID: req.sessionID
  });
});

// 登录页面（多登录方式）
router.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  
  const messages = {
    error: req.flash('error'),
    info: req.flash('info')
  };
  
  res.render('login', { messages });
});

// 注册页面
router.get('/register', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  
  res.render('register', { 
    messages: { error: req.flash('error') }
  });
});

// 登录失败页面
router.get('/login-failed', (req, res) => {
  const errorMessage = req.flash('error')[0] || '未知错误';
  res.render('login-failed', { error: errorMessage });
});

module.exports = router;