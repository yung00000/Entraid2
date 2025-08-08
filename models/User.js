const db = require('../database/db');
const bcrypt = require('bcrypt');

class User {
  // 通过邮箱查找用户
  static findByEmail(email, callback) {
    db.get('SELECT * FROM users WHERE email = ?', [email], callback);
  }

  // 通过提供者和ID查找用户
  static findByProvider(provider, providerId, callback) {
    db.get('SELECT * FROM users WHERE provider = ? AND provider_id = ?', [provider, providerId], callback);
  }

  // 创建新用户
  static create(user, callback) {
    const { email, password, displayName, provider, providerId } = user;
    
    // 如果是本地注册用户，加密密码
    const handleInsert = (hashedPassword) => {
      db.run(
        `INSERT INTO users (email, password, display_name, provider, provider_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [email, hashedPassword, displayName, provider, providerId],
        function(err) {
          if (err) return callback(err);
          callback(null, { id: this.lastID, email, displayName, provider });
        }
      );
    };

    if (provider === 'local') {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) return callback(err);
        handleInsert(hash);
      });
    } else {
      // 第三方登录没有密码
      handleInsert(null);
    }
  }

  // 验证密码
  static verifyPassword(password, hash, callback) {
    bcrypt.compare(password, hash, callback);
  }
}

module.exports = User;