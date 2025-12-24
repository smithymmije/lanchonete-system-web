module.exports = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ erro: 'Token não fornecido' });
  
    // Por enquanto aceitamos "ok" (depois trocamos por JWT)
    if (token === 'ok') return next();
  
    return res.status(401).json({ erro: 'Token inválido' });
  };