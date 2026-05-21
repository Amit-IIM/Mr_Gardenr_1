const { setCorsHeaders } = require('./_auth');

module.exports = async (req, res) => {
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Clear cookie by setting expiration in the past
  res.setHeader('Set-Cookie', 'SessionId=; Path=/; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  res.status(200).json({ success: true });
};
