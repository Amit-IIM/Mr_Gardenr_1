const { setCorsHeaders, verifySession } = require('./_auth');

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

  // Authenticate request
  const session = verifySession(req, res);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized. Invalid or expired session.' });
    return;
  }

  // Because the Vercel API commits every change directly to GitHub on POST /api/content and /api/upload,
  // there is no need for local shell Git operations. The repo is already up-to-date!
  res.status(200).json({
    success: true,
    message: 'Changes are already saved and committed directly to GitHub! Vercel is automatically building the latest update.'
  });
};
