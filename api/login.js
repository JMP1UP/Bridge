// Vercel Serverless Function: api/login.js
// Handles secure student and teacher login validations, issuing signed JWT tokens.

const db = require('./db');
const auth = require('./auth-helper');

module.exports = async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password parameters' });
  }

  const cleanInput = email.toLowerCase().trim();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';

  try {
    // Brute-force protection: check for failed attempts in last 15 minutes
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const recentFailures = await db.select('logs', `type=eq.Auth Failure&actor=eq.${cleanInput}&created_at=gte.${fifteenMinsAgo}`);
    
    if (recentFailures && recentFailures.length >= 5) {
      return res.status(429).json({ 
        error: 'Too many failed login attempts. This account is temporarily locked. Please try again in 15 minutes.' 
      });
    }

    const logFailure = async () => {
      try {
        await db.insert('logs', {
          id: 'log_' + Date.now(),
          type: 'Auth Failure',
          action: `Failed login attempt from IP ${ip}`,
          actor: cleanInput
        });
      } catch (err) {
        console.error('Failed to log auth failure:', err);
      }
    };

    // 1. Check Platform Administrator login
    if (cleanInput === 'admin' || cleanInput === 'admin@school-bridge.org') {
      const isAdminMatch = password === 'admin123';
      if (!isAdminMatch) {
        await logFailure();
        return res.status(401).json({ error: 'Incorrect administrator password' });
      }

      const token = auth.signJwt({ id: 'admin', role: 'admin' });
      return res.status(200).json({
        success: true,
        token,
        user: { id: 'admin', name: 'System Admin', role: 'admin', email: 'admin@school-bridge.org' }
      });
    }

    // 2. Check Coordinators table
    const coordinators = await db.select('coordinators', `email=eq.${cleanInput}`);
    const coordinator = coordinators[0];

    if (coordinator) {
      const isPasswordMatch = await auth.verifyPassword(password, coordinator.password_hash);
      if (!isPasswordMatch) {
        await logFailure();
        return res.status(401).json({ error: 'Incorrect password' });
      }

      const token = auth.signJwt({ id: coordinator.id, role: coordinator.role.toLowerCase() });
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: coordinator.id,
          name: coordinator.name,
          email: coordinator.email,
          role: coordinator.role.toLowerCase(),
          schoolId: coordinator.school_id
        }
      });
    }

    // 3. Check Students table
    const students = await db.select('students', `email=eq.${cleanInput}`);
    const student = students[0];

    if (student) {
      const isPasswordMatch = await auth.verifyPassword(password, student.password_hash);
      if (!isPasswordMatch) {
        await logFailure();
        return res.status(401).json({ error: 'Incorrect password' });
      }

      const token = auth.signJwt({ id: student.id, role: 'student' });
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: student.id,
          name: student.name,
          email: student.email,
          role: 'student',
          schoolId: student.school_id,
          language: student.language || 'en'
        }
      });
    }

    // No profile found matching email
    await logFailure();
    return res.status(404).json({ error: 'No account found matching this email address' });

  } catch (error) {
    console.error('Login authorization failed:', error);
    return res.status(500).json({ error: error.message });
  }
}
