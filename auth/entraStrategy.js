const { OIDCStrategy } = require('passport-azure-ad');
const dotenv = require('dotenv');
const User = require('../models/User');
dotenv.config();

module.exports = new OIDCStrategy(
  {
    identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0/.well-known/openid-configuration`,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    responseType: 'code',
    responseMode: 'form_post',
    redirectUrl: process.env.REDIRECT_URI,
    allowHttpForRedirectUrl: true,
    scope: ['openid', 'profile', 'email'],
    validateIssuer: true,
    passReqToCallback: false,
  },
  async (iss, sub, profile, done) => {
    try {
      // 1. 尝试通过提供者ID查找用户
      const existingUser = await new Promise((resolve, reject) => {
        User.findByProvider('entra-id', profile.oid, (err, user) => {
          if (err) reject(err);
          resolve(user);
        });
      });

      if (existingUser) {
        return done(null, existingUser);
      }

      // 2. 用户不存在，创建新用户
      const newUser = {
        email: profile._json.email || profile.upn,
        displayName: profile.displayName,
        provider: 'entra-id',
        providerId: profile.oid
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