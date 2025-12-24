const router = require('express').Router();
const produtoController = require('../controllers/produtoController');

router.get('/', produtoController.listarProdutos);

module.exports = router;