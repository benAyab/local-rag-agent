import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: "Token d'authentification manquant" });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide ou expiré' });
    }
    
    req.user = user;
    next();
  });
};
