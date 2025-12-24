const Produto = require('../models/Produto');

// ================================
// 📦 LISTAR PRODUTOS
// ================================
exports.listarProdutos = async (req, res) => {
  try {
    const produtos = await Produto.find().sort({ createdAt: -1 });
    res.json(produtos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar produtos' });
  }
};

// ================================
// ➕ CRIAR PRODUTO
// ================================
exports.criarProduto = async (req, res) => {
  try {
    const { nome, descricao, preco, categoria } = req.body;

    // 🔒 Validações básicas
    if (!nome || !preco) {
      return res.status(400).json({ erro: 'Nome e preço são obrigatórios' });
    }

    const produto = new Produto({
      nome,
      descricao,
      preco: Number(preco),
      categoria,
      disponivel: true, // ✅ garante valor padrão
      imagem: req.file ? req.file.filename : null
    });

    await produto.save();
    res.status(201).json(produto);

  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ erro: error.message });
  }
};

// ================================
// ✏️ ATUALIZAR PRODUTO
// ================================
exports.atualizarProduto = async (req, res) => {
  try {
    const { id } = req.params;

    const updates = {
      nome: req.body.nome,
      descricao: req.body.descricao,
      categoria: req.body.categoria
    };

    // ✅ só valida preço se ele vier
    if (req.body.preco !== undefined) {
      const preco = parseFloat(req.body.preco);
      if (isNaN(preco)) {
        return res.status(400).json({ erro: 'Preço deve ser um número válido' });
      }
      updates.preco = preco;
    }

    // ✅ imagem é opcional na edição
    if (req.file) {
      updates.imagem = req.file.filename;
    }

    const produto = await Produto.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.json(produto);

  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ erro: error.message });
  }
};


// ================================
// 🗑️ EXCLUIR PRODUTO
// ================================
exports.excluirProduto = async (req, res) => {
  try {
    const { id } = req.params;

    const produto = await Produto.findByIdAndDelete(id);

    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.json({ mensagem: 'Produto excluído com sucesso' });

  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ erro: error.message });
  }
};

// ================================
// ⏯️ ALTERNAR DISPONIBILIDADE (Pausar/Ativar)
// ================================
exports.alternarDisponibilidade = async (req, res) => {
  try {
    const { id } = req.params;
    const { disponivel } = req.body; // true ou false

    const produto = await Produto.findByIdAndUpdate(
      id,
      { disponivel },
      { new: true }
    );

    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.json(produto);

  } catch (error) {
    console.error('Erro ao alterar disponibilidade:', error);
    res.status(500).json({ erro: error.message });
  }
};