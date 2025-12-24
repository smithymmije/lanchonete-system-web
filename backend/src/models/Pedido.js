const mongoose = require('mongoose');

const PedidoSchema = new mongoose.Schema({
  items: [{
    produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto', required: true },
    quantidade: { type: Number, min: 1, required: true },
    precoUnitario: { type: Number, required: true },
    nome: String
  }],
  total: { type: Number, required: true },
  clienteNome: { type: String, required: true },
  clienteTelefone: String,
  status: { 
    type: String, 
    enum: ['aguardando_pagamento', 'pago', 'preparando', 'pronto', 'saiu_entrega', 'entregue'], 
    default: 'aguardando_pagamento' 
  },
  linkAcompanhamento: { type: String, unique: true, required: true },
  pixCopiaCola: String,
  pixQrCode: String, // Base64 da imagem
  mercadoPagoId: { type: String, index: true }, // ID retornado pela API de Pagamentos
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pedido', PedidoSchema);