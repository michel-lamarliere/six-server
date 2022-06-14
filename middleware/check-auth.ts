import { RequestHandler } from 'express';
const jwt = require('jsonwebtoken');

const checkAuth: RequestHandler =  (
  // req: { method: string; headers: { authorization: string }; userData: { id: {} } },
  req: any,
  res,
  next
) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  if (!req.headers.authorization) {
    res.status(403).json({ error: true, message: 'Pas de req.header.authorization' });
    return;
  }

  try {
    const token = req.headers.authorization.split(' ')[1];


    if (!token) {
      res.status(403).json({
        error: true,
        message: "Vous n'êtes pas autorisé à effectuer cette action.",
      });
      return;
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    req.body.userId = decodedToken.id;
    next();
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la vérification d'autorisation.",
    });
    return;
  }
};

module.exports = checkAuth;
