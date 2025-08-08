const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      // 1. 查找用户
      const user = await new Promise((resolve, reject) => {
        User.findByEmail(email, (err, user) => {
          if (err) reject(err);
          resolve(user);
        });
      });

      if (!user) {
        return done(null, false, { message: '用户不存在' });
      }

      // 2. 验证密码
      const isValidPassword = await new Promise((resolve, reject) => {
        User.verifyPassword(password, user.password, (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });

      if (!isValidPassword) {
        return done(null, false, { message: '密码错误' });
      }

      // 3. 验证通过
      done(null, user);
    } catch (err) {
      done(err);
    }
  }
);