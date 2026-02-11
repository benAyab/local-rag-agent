import express from 'express';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';

import { encryptPassword, comparePassword } from "../utils/helper.password.js";

const router = express.Router();

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation simple
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    // Check if user exist
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: "Nom d'utilisateur ou email déjà utilisé" 
      });
    }
    
    // Create user  Warning: hash password in PROD
    const user = new User({
      username,
      email,
      password //
    });
    
    await user.save();
    
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user_id: user._id
    });
    
  } catch (error) {
    next(error);
  }
});

// Connection
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis" });
    }
    
    // Search user
    const user = await User.findOne({ username, password });
    
    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    
    // Générer le token JWT
    const token = jwt.sign(
      { sub: user.username, userId: user._id },
      process.env.JWT_SECRET || 'lcvmlfgsfbdfdbdbssgbsg',
      { expiresIn: '30m' }
    );
    
    res.json({
      access_token: token,
      token_type: 'bearer',
      username: user.username
    });
    
  } catch (error) {
    next(error);
  }
});

export default router;