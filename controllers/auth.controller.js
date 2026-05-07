const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../models');

const SALT_ROUNDS = 10;
const googleClient = new OAuth2Client();
const { Op } = db.Sequelize;

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function serializeUser(user) {
  return {
    id: Number(user.id),
    name: user.name,
    email: user.email,
    auth_provider: user.auth_provider,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function googleAudiences() {
  const value = process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || '';
  return value
    .split(',')
    .map((clientId) => clientId.trim())
    .filter(Boolean);
}

function emailWhere(email) {
  return db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), email);
}

exports.register = async (req, res) => {
  try {
    const { name, password } = req.body ?? {};
    const email = normalizeEmail(req.body?.email);

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name must be a non-empty string' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'email must be valid' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'password must be at least 8 characters' });
    }

    const existing = await db.User.findOne({ where: emailWhere(email) });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await db.User.create({ name: name.trim(), email, password_hash });

    const token = signToken(user);

    return res.status(201).json({
      user: serializeUser(user),
      token,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { password } = req.body ?? {};
    const email = normalizeEmail(req.body?.email);

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await db.User.findOne({ where: emailWhere(email) });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.password_hash) {
      return res.status(401).json({ error: 'This account uses Google login' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);

    return res.status(200).json({
      user: serializeUser(user),
      token,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const idToken = typeof req.body?.idToken === 'string' ? req.body.idToken.trim() : '';
    const audiences = googleAudiences();

    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required' });
    }
    if (audiences.length === 0) {
      return res.status(500).json({ error: 'GOOGLE_CLIENT_ID or GOOGLE_CLIENT_IDS is not configured' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: audiences.length === 1 ? audiences[0] : audiences,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload?.email || payload.email_verified !== true) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const email = normalizeEmail(payload.email);
    const name = cleanGoogleName(payload);

    let user = await db.User.findOne({
      where: {
        [Op.or]: [
          emailWhere(email),
          { google_id: payload.sub },
        ],
      },
    });

    if (user) {
      const updates = {};
      if (!user.google_id) updates.google_id = payload.sub;
      if (!user.name && name) updates.name = name;
      if (!user.password_hash) updates.auth_provider = 'google';

      if (Object.keys(updates).length > 0) {
        await user.update(updates);
      }
    } else {
      user = await db.User.create({
        name,
        email,
        password_hash: null,
        google_id: payload.sub,
        auth_provider: 'google',
      });
    }

    return res.status(200).json({
      user: serializeUser(user),
      token: signToken(user),
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid Google token' });
  }
};

function cleanGoogleName(payload) {
  const fullName = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (fullName) return fullName;

  const givenName = typeof payload.given_name === 'string' ? payload.given_name.trim() : '';
  const familyName = typeof payload.family_name === 'string' ? payload.family_name.trim() : '';
  const fallbackName = [givenName, familyName].filter(Boolean).join(' ').trim();
  if (fallbackName) return fallbackName;

  return normalizeEmail(payload.email).split('@')[0];
}

exports.me = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'auth_provider', 'created_at', 'updated_at'],
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json({ user: serializeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.logout = async (req, res) => {
  return res.status(200).json({
    message: 'Logged out successfully. Discard the token on the mobile client.',
  });
};
