const { setCorsHeaders, verifySession, commitToGitHub } = require('./_auth');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const dbPath = path.join(process.cwd(), 'data', 'content.json');

  if (req.method === 'GET') {
    try {
      if (fs.existsSync(dbPath)) {
        const content = fs.readFileSync(dbPath, 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.status(200).end(content);
      } else {
        res.status(404).json({ error: 'Database content file not found.' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to read database: ' + err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    // Authenticate POST request
    const session = verifySession(req, res);
    if (!session) {
      res.status(401).json({ error: 'Unauthorized. Invalid or expired session.' });
      return;
    }

    try {
      let body = '';
      req.on('data', chunk => body += chunk);
      await new Promise(resolve => req.on('end', resolve));

      // Parse to ensure valid JSON
      const parsedData = JSON.parse(body);
      const contentBuffer = Buffer.from(JSON.stringify(parsedData, null, 2), 'utf8');

      // 1. Save locally (for local development or testing)
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      fs.writeFileSync(dbPath, contentBuffer);

      // 2. Commit to GitHub REST API (for serverless Vercel persistence)
      if (process.env.GITHUB_TOKEN) {
        await commitToGitHub('data/content.json', contentBuffer, 'CMS Update: content.json');
      }

      res.status(200).json({ success: true, message: 'Content saved successfully.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save content: ' + err.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method Not Allowed' });
};
