const mongoose = require('mongoose');

const ProdutoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: String,
  preco: { type: Number, required: true },
  categoria: { type: String, enum: ['lanche', 'bebida', 'sobremesa', 'combo'], default: 'lanche' },
  disponivel: { type: Boolean, default: true },
  imagem: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Produto', ProdutoSchema);