import express from 'express';
const router = express.Router();


import { authenticateToken } from '../middleware/auth.js';

import ragService from '../services/ragService.js';


router.post('/', authenticateToken,  async (req, res, next) => {
  try {
    const { query } = req.body;
    
    if (!query || ((query + "").trim() === "")) {
      return res.status(400).json({ error: "Rêquete invalide ou vide" });
    }
    
    // Get agent response
    
    const resp = await ragService.query(query);

    return res.json(resp);
  } catch (error) {
    //next(error);
    return  { error: error.message, status: 'erreur' };
  }
});

export default router;