const router = require('express').Router();
const pedidoController = require('../controllers/pedidoController');
const produtoController = require('../controllers/produtoController');
const upload = require('../middlewares/upload');
const auth = require('../middlewares/auth');

router.use(auth); // protege TODAS as rotas abaixo

// ===== PEDIDOS =====
router.get('/pedidos', pedidoController.listarPedidosAdmin);
router.put('/pedidos/:id/status', pedidoController.atualizarStatus);

// ===== PRODUTOS =====
router.get('/produtos', produtoController.listarProdutos);
router.post('/produtos', upload.single('imagem'), produtoController.criarProduto);
router.put('/produtos/:id', upload.single('imagem'), produtoController.atualizarProduto);
router.delete('/produtos/:id', produtoController.excluirProduto);
router.patch('/produtos/:id/disponivel', produtoController.alternarDisponibilidade); // ✅ NOVA ROTA

module.exports = router;