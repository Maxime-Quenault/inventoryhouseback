const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');

const SALT_ROUNDS = 10;

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'password must be at least 8 characters' });
    }

    const existing = await db.User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await db.User.create({ email, password_hash });

    const token = jwt.sign(
      { sub: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      user: { id: user.id, email: user.email },
      token,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};