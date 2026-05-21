const { setCorsHeaders, verifySession, commitToGitHub, getRawBody } = require('./_auth');
const fs = require('fs');
const path = require('path');

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

  const { filename } = req.query;
  if (!filename) {
    res.status(400).json({ error: 'Missing filename query parameter.' });
    return;
  }

  try {
    const fileBuffer = await getRawBody(req);

    // 1. Save locally (for local dev)
    const imgDir = path.join(process.cwd(), 'images');
    if (!fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir, { recursive: true });
    }
    const localFilePath = path.join(imgDir, filename);
    fs.writeFileSync(localFilePath, fileBuffer);

    // 2. Commit to GitHub REST API (for serverless Vercel persistence)
    if (process.env.GITHUB_TOKEN) {
      await commitToGitHub(`images/${filename}`, fileBuffer, `CMS Image Upload: ${filename}`);
    }

    res.status(200).json({
      success: true,
      url: `images/${filename}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
};
