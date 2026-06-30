// api/auth-helper.js
// Secure, zero-dependency password hashing and JWT session signing using Node's built-in crypto module.
// Ideal for serverless Vercel environments to minimize cold starts.

const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'bridge-exchange-safe-jwt-secret-fallback-key';

function base64url(source) {
  let encoded = Buffer.from(source).toString('base64');
  return encoded.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecode(source) {
  let base64 = source.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

const auth = {
  // Hash password using PBKDF2 (Secure hashing algorithm recommended by OWASP)
  hashPassword(password) {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(`${salt}:${derivedKey.toString('hex')}`);
      });
    });
  },

  // Verify password match against hash
  verifyPassword(password, hash) {
    return new Promise((resolve, reject) => {
      if (!hash || !hash.includes(':')) {
        // Fallback for legacy plain text passwords in mock database
        resolve(password === hash);
        return;
      }
      const [salt, key] = hash.split(':');
      crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(key === derivedKey.toString('hex'));
      });
    });
  },

  // Generate a cryptographically signed JWT token
  signJwt(payload, expiresInMs = 86400000) { // Default 24 hours
    const header = { alg: 'HS256', typ: 'JWT' };
    const expiry = Date.now() + expiresInMs;
    const jwtPayload = { ...payload, exp: expiry };

    const stringHeader = base64url(JSON.stringify(header));
    const stringPayload = base64url(JSON.stringify(jwtPayload));

    const signatureInput = `${stringHeader}.${stringPayload}`;
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signatureInput)
      .digest('base64url');

    return `${signatureInput}.${signature}`;
  },

  // Verify and decode JWT token
  verifyJwt(token) {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signature] = parts;
    const signatureInput = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signatureInput)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null; // Signature verification failed
    }

    try {
      const decodedPayload = JSON.parse(base64urlDecode(payloadB64));
      // Check expiry
      if (decodedPayload.exp && Date.now() > decodedPayload.exp) {
        return null; // Token expired
      }
      return decodedPayload;
    } catch (e) {
      return null; // JSON parsing failed
    }
  }
};

module.exports = auth;
