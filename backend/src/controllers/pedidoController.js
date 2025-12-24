const Pedido = require('../models/Pedido');
const Produto = require('../models/Produto');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

exports.criarPedido = async (req, res) => {
console.log('BODY CHEGANDO:', JSON.stringify(req.body, null, 2));
  try {
    const { items, clienteNome, clienteTelefone } = req.body;
    let total = 0;
    const itemsProcessados = [];

    for (const item of items) {
      const produto = await Produto.findById(item.produtoId);
      if (!produto || !produto.disponivel) {
        return res.status(400).json({ erro: `Produto ${item.produtoId} indisponível` });
      }
      const subtotal = produto.preco * item.quantidade;
      total += subtotal;
      itemsProcessados.push({
        produtoId: produto._id,
        quantidade: item.quantidade,
        precoUnitario: produto.preco,
        nome: produto.nome
      });
    }

    const linkAcompanhamento = uuidv4().substring(0, 8);
    const qrCodeData = `00020126580014BR.GOV.BCB.PIX0136teste@example.com5204000053039865404${total.toFixed(2)}5802BR5913LANCHONETE6009SAO_PAULO62070503***6304`;
    const qrCodeBase64 = await QRCode.toDataURL(qrCodeData);
    
    const pedido = new Pedido({
      items: itemsProcessados,
      total,
      clienteNome,
      clienteTelefone,
      enderecoEntrega, // ← agora vai pro banco
      linkAcompanhamento,
      pixCopiaCola: qrCodeData,
      pixQrCode: qrCodeBase64
    });

    await pedido.save();
    res.json({
      pedido: {
        id: pedido._id,
        linkAcompanhamento,
        total,
        status: pedido.status,
        qrCode: qrCodeBase64,
        copiaCola: qrCodeData
      }
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ erro: 'Erro ao criar pedido' });
  }
};

exports.obterPedido = async (req, res) => {
  try {
    const { link } = req.params;
    const pedido = await Pedido.findOne({ linkAcompanhamento: link }).populate('items.produtoId', 'nome imagem');
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar pedido' });
  }
};

exports.atualizarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const pedido = await Pedido.findByIdAndUpdate(id, { status, updatedAt: new Date() }, { new: true });
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
    const io = req.app.get('io');
    io.to(pedido.linkAcompanhamento).emit('statusUpdate', { status });
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar status' });
  }
};

exports.listarPedidosAdmin = async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar pedidos' });
  }
};