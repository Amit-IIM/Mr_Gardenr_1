const { setCorsHeaders, ADMIN_USERNAME, ADMIN_PASSWORD_HASH, getSha256Hash } = require('./_auth');
const crypto = require('crypto');

// In-memory rate limiting state per lambda instance
const loginAttempts = {};

module.exports = async (req, res) => {
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();

  // Enforce locked-out state
  if (loginAttempts[ip]) {
    const attempt = loginAttempts[ip];
    if (attempt.count >= 5) {
      const elapsed = (now - attempt.lockoutTime) / 1000;
      const remaining = 900 - elapsed; // 15 minutes lockout
      if (remaining > 0) {
        res.status(429).json({
          error: `Too many failed attempts. Locked out. Try again in ${Math.ceil(remaining / 60)} minutes.`
        });
        return;
      } else {
        // Lockout expired
        delete loginAttempts[ip];
      }
    }
  }

  try {
    let body = '';
    req.on('data', chunk => body += chunk);
    await new Promise(resolve => req.on('end', resolve));
    
    const { username, password } = JSON.parse(body);
    
    if (username === ADMIN_USERNAME && getSha256Hash(password) === ADMIN_PASSWORD_HASH) {
      // Clear lockout on success
      if (loginAttempts[ip]) {
        delete loginAttempts[ip];
      }

      // Create secure stateless session token
      const sessionData = {
        username: username,
        expires: Date.now() + 30 * 60 * 1000 // 30 minutes expiration
      };
      
      const payload = Buffer.from(JSON.stringify(sessionData)).toString('base64');
      const signature = crypto.createHmac('sha256', ADMIN_PASSWORD_HASH).update(payload).digest('hex');
      const token = `${payload}.${signature}`;
      
      res.setHeader('Set-Cookie', `SessionId=${token}; Path=/; HttpOnly; SameSite=Strict`);
      res.status(200).json({ success: true, message: 'Login successful' });
    } else {
      // Track failed attempt
      if (!loginAttempts[ip]) {
        loginAttempts[ip] = { count: 1, lockoutTime: 0 };
      } else {
        loginAttempts[ip].count++;
        if (loginAttempts[ip].count >= 5) {
          loginAttempts[ip].lockoutTime = now;
        }
      }

      const failedCount = loginAttempts[ip].count;
      const remainingAttempts = 5 - failedCount;

      if (remainingAttempts > 0) {
        res.status(401).json({
          error: `Invalid username or password. ${remainingAttempts} attempts remaining.`
        });
      } else {
        res.status(429).json({
          error: 'Too many failed attempts. Locked out for 15 minutes.'
        });
      }
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid request payload.' });
  }
};
