const { OIDCStrategy } = require('passport-azure-ad');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  strategy: new OIDCStrategy(
    {
      identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0/.well-known/openid-configuration`,
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      responseType: 'code',
      responseMode: 'form_post',
      redirectUrl: process.env.REDIRECT_URI,
      allowHttpForRedirectUrl: true, // 开发环境允许HTTP
      scope: ['openid', 'profile', 'email'],
      validateIssuer: true,
      passReqToCallback: false,
      loggingLevel: 'info', // 调试时开启
      loggingNoPII: false   // 允许打印敏感信息（仅开发）
    },
    (iss, sub, profile, done) => {
      // 构造用户对象
      const user = {
        id: profile.oid,
        displayName: profile.displayName,
        email: profile._json.email || profile.upn,
        provider: 'entra-id'
      };
      return done(null, user);
    }
  ),

  // 序列化用户
  serializeUser: (user, done) => done(null, user),
  deserializeUser: (user, done) => done(null, user),

  sessionConfig: {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // 开发环境用false，生产用true（HTTPS）
      maxAge: 24 * 60 * 60 * 1000 // 24小时
    }
  }
};