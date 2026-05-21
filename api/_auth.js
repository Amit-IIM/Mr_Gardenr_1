const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Helper to get allowed CORS origin
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:8080';

// Helper to get admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Amit Kumar';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 'f8a9521231009ccaa87273fe4f882f294f204f4bec07e1752fdac37ae43f2342';

// Set CORS headers
function setCorsHeaders(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// SHA-256 hashing helper
function getSha256Hash(string) {
  if (!string) return '';
  return crypto.createHash('sha256').update(string, 'utf8').digest('hex');
}

// Verify and slide session
function verifySession(req, res) {
  const cookieHeader = req.headers.cookie;
  let token = null;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const trimmed = cookie.trim();
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex !== -1) {
        const name = trimmed.substring(0, eqIndex);
        const value = trimmed.substring(eqIndex + 1);
        if (name === 'SessionId') {
          token = value;
          break;
        }
      }
    }
  }

  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    
    // Use ADMIN_PASSWORD_HASH as the signing secret
    const expectedSignature = crypto.createHmac('sha256', ADMIN_PASSWORD_HASH).update(payload).digest('hex');
    if (signature !== expectedSignature) return null;

    const sessionData = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    if (Date.now() > sessionData.expires) return null;

    // Slide session window (refresh token)
    sessionData.expires = Date.now() + 30 * 60 * 1000;
    const newPayload = Buffer.from(JSON.stringify(sessionData)).toString('base64');
    const newSignature = crypto.createHmac('sha256', ADMIN_PASSWORD_HASH).update(newPayload).digest('hex');
    const newToken = `${newPayload}.${newSignature}`;
    res.setHeader('Set-Cookie', `SessionId=${newToken}; Path=/; HttpOnly; SameSite=Strict`);

    return sessionData;
  } catch (err) {
    return null;
  }
}

// Helper to commit to GitHub via REST API
async function commitToGitHub(filePath, contentBuffer, message) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER || 'Amit-IIM';
  const repo = process.env.GITHUB_REPO_NAME || 'Mr_Gardenr_1';

  if (!token) {
    console.warn('GITHUB_TOKEN environment variable is not configured. File changes will only be saved locally.');
    return null;
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  
  // 1. Get current file SHA (if it exists)
  const getRes = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Vercel-CMS'
    }
  });

  let sha = null;
  if (getRes.status === 200) {
    const data = await getRes.json();
    sha = data.sha;
  }

  // 2. Commit the new file content
  const putRes = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Vercel-CMS'
    },
    body: JSON.stringify({
      message: message,
      content: contentBuffer.toString('base64'),
      sha: sha
    })
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`GitHub API error: ${putRes.status} ${errText}`);
  }

  return await putRes.json();
}

// Raw body parser
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', err => reject(err));
  });
}

module.exports = {
  ADMIN_USERNAME,
  ADMIN_PASSWORD_HASH,
  ALLOWED_ORIGIN,
  setCorsHeaders,
  getSha256Hash,
  verifySession,
  commitToGitHub,
  getRawBody
};
