const router = require('express').Router();
const Usuario = require('../models/Usuario');

// Registrar primeiro admin
router.post('/registrar', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    const existe = await Usuario.findOne({ usuario });
    if (existe) return res.status(400).json({ erro: 'Usuário já existe' });

    const admin = new Usuario({ usuario, senha });
    await admin.save();
    res.json({ mensagem: 'Admin criado com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao registrar admin' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    const admin = await Usuario.findOne({ usuario });
    if (!admin) return res.status(401).json({ erro: 'Usuário ou senha inválidos' });

    const senhaOk = await admin.compararSenha(senha);
    if (!senhaOk) return res.status(401).json({ erro: 'Usuário ou senha inválidos' });

    res.json({ token: 'ok' }); // depois trocamos por JWT
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

module.exports = router;