const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv');
const User = require('../models/User');
dotenv.config();

module.exports = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URI,
    passReqToCallback: false
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // 1. 尝试通过提供者ID查找用户
      const existingUser = await new Promise((resolve, reject) => {
        User.findByProvider('google', profile.id, (err, user) => {
          if (err) reject(err);
          resolve(user);
        });
      });

      if (existingUser) {
        return done(null, existingUser);
      }

      // 2. 用户不存在，创建新用户
      const email = profile.emails[0].value;
      const newUser = {
        email,
        displayName: profile.displayName,
        provider: 'google',
        providerId: profile.id
      };

      User.create(newUser, (err, user) => {
        if (err) return done(err);
        done(null, user);
      });
    } catch (err) {
      done(err);
    }
  }
);