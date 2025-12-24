//const API_URL = 'http://localhost:4000/api';
const API_URL = 'https://lanchonete-system-web-backend.onrender.com/api';

let produtos = [];
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
let pedidoLink = null;
let socket = null;

/* ======================================================
    🔹 CARREGAR PRODUTOS
====================================================== */
async function carregarProdutos() {
    try {
        const response = await fetch(`${API_URL}/produtos`);
        produtos = await response.json();

        produtos.forEach(p => {
            p.preco = Number(p.preco);
        });

        exibirProdutos(produtos);
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        mostrarNotificacao('Erro ao carregar produtos.');
    }
}

/* ======================================================
    🔹 EXIBIR PRODUTOS (COM INDISPOINÍVEL)
====================================================== */
function exibirProdutos(produtosFiltrados) {
    const container = document.getElementById('produtosContainer');
    if (!container) return;

    container.innerHTML = '';

    produtosFiltrados.forEach(produto => {
        const disponivel = produto.disponivel !== false;

        container.innerHTML += `
            <div class="col-md-4 mb-4 produto-card" data-categoria="${produto.categoria}">
                <div class="card h-100 shadow">
                    <img src="${produto.imagem 
                            ? `https://lanchonete-system-web-backend.onrender.com/uploads/${produto.imagem}` 
                            : 'https://via.placeholder.com/300x200?text=Sem+Imagem'}"
                            class="card-img-top" style="height:200px; object-fit:cover;">
                    <div class="card-body">
                        <h5>${produto.nome}</h5>
                        <p>${produto.descricao || ''}</p>
                        <h4 class="text-danger">R$ ${produto.preco.toFixed(2)}</h4>

                        ${disponivel
                            ? `<button class="btn btn-danger w-100"
                                    onclick="adicionarCarrinho('${produto._id}')">
                                    Adicionar ao Carrinho
                               </button>`
                            : `<button class="btn btn-secondary w-100" disabled>
                                    Indisponível
                               </button>`
                        }
                    </div>
                </div>
            </div>
        `;
    });
}

/* ======================================================
    🔹 FILTRO
====================================================== */
function filtrarCategoria(categoria) {
    document.querySelectorAll('.produto-card').forEach(card => {
        card.style.display =
            categoria === 'todos' ||
            (categoria === 'combo' && card.dataset.categoria === 'combos') ||
            card.dataset.categoria === categoria
                ? 'block'
                : 'none';
    });
}

/* ======================================================
    🔹 CARRINHO (COM PROTEÇÃO)
====================================================== */
function adicionarCarrinho(produtoId) {
    const produto = produtos.find(p => p._id === produtoId);
    if (!produto || !produto.disponivel) {
        alert('Produto indisponível no momento.');
        return;
    }

    const existente = carrinho.find(i => i.produtoId === produtoId);

    if (existente) {
        existente.quantidade++;
    } else {
        carrinho.push({
            produtoId: produto._id,
            nome: produto.nome,
            preco: Number(produto.preco),
            quantidade: 1
        });
    }

    salvarCarrinho();
    atualizarCarrinhoUI();
    mostrarNotificacao(`${produto.nome} adicionado`);
}

function atualizarCarrinhoUI() {
    const count = carrinho.reduce((t, i) => t + Number(i.quantidade), 0);
    const badge = document.getElementById('carrinhoCount');
    if (badge) badge.textContent = count;
}

function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

function mostrarCarrinho() {
    const container = document.getElementById('carrinhoItems');
    const totalEl = document.getElementById('carrinhoTotal');
    if (!container || !totalEl) return;

    container.innerHTML = '';
    let total = 0;

    if (carrinho.length === 0) {
        container.innerHTML = '<p class="text-center">Carrinho vazio</p>';
    } else {
        carrinho.forEach((item, index) => {
            const subtotal = Number(item.preco) * Number(item.quantidade);
            total += subtotal;

            container.innerHTML += `
                <div class="d-flex justify-content-between border-bottom mb-2">
                    <div>
                        <strong>${item.nome}</strong><br>
                        <small>R$ ${item.preco.toFixed(2)} x ${item.quantidade}</small>
                    </div>
                    <button class="btn btn-sm text-danger"
                        onclick="removerItem(${index})">🗑️</button>
                </div>
            `;
        });
    }

    totalEl.textContent = total.toFixed(2);
    const modalEl = document.getElementById('carrinhoModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

function removerItem(index) {
    carrinho.splice(index, 1);
    salvarCarrinho();
    atualizarCarrinhoUI();
    mostrarCarrinho();
}
/* ======================================================
    🔹 FINALIZAR PEDIDO - FUNÇÔES NOVAS
====================================================== */
function validarCampos() {
    const campos = [
        { id: 'clienteNome', nome: 'Nome completo' },
        { id: 'clienteTelefone', nome: 'Celular (DDD)' },
        { id: 'clienteCEP', nome: 'CEP' },
        { id: 'clienteRua', nome: 'Rua' },
        { id: 'clienteNumero', nome: 'Número' },
        { id: 'clienteBairro', nome: 'Bairro' },
        { id: 'clienteCidade', nome: 'Cidade' }
    ];

    for (let c of campos) {
        const v = document.getElementById(c.id).value.trim();
        if (!v) { alert(`Preencha o campo ${c.nome}`); return false; }
    }

    const tel = document.getElementById('clienteTelefone').value.replace(/\D/g, '');
    if (tel.length !== 11) { alert('Telefone deve ter 11 dígitos (com DDD)'); return false; }

    const cep = document.getElementById('clienteCEP').value.replace(/\D/g, '');
    if (cep.length !== 8) { alert('CEP inválido'); return false; }

    return true;
}



/* ======================================================
    🔹 FINALIZAR PEDIDO
====================================================== */
async function finalizarPedido() {
    if (carrinho.length === 0) {
        alert('Carrinho vazio!');
        return;
    }
    if (!validarCampos()) return; // 👉 nova validação

    const total = carrinho.reduce((acc, item) => acc + (Number(item.preco) * Number(item.quantidade)), 0);

    try {
        const response = await fetch(`${API_URL}/pedidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: carrinho.map(item => ({
                    produtoId: item.produtoId,
                    quantidade: Number(item.quantidade),
                    precoUnitario: Number(item.preco),
                    nome: item.nome
                })),
                total: total,
                clienteNome: document.getElementById('clienteNome').value.trim(),
                clienteTelefone: document.getElementById('clienteTelefone').value.replace(/\D/g, ''),
                enderecoEntrega: {
                    cep: document.getElementById('clienteCEP').value.replace(/\D/g, ''),
                    rua: document.getElementById('clienteRua').value.trim(),
                    numero: document.getElementById('clienteNumero').value.trim(),
                    complemento: document.getElementById('clienteComplemento').value.trim(),
                    bairro: document.getElementById('clienteBairro').value.trim(),
                    cidade: document.getElementById('clienteCidade').value.trim()
                }
            })
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.error || 'Erro ao gerar Pix');
            return;
        }

        document.getElementById('qrCode').src = `data:image/png;base64,${data.pixQrCode}`;
        document.getElementById('copiaCola').textContent = data.pixCopiaCola;
        document.getElementById('linkAcompanhamento').href = `/pedido.html?id=${data.linkAcompanhamento}`;

        carrinho = [];
        salvarCarrinho();
        atualizarCarrinhoUI();

        const carrinhoModal = bootstrap.Modal.getInstance(document.getElementById('carrinhoModal'));
        if (carrinhoModal) carrinhoModal.hide();

        const checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
        checkoutModal.show();

        conectarSocket(data.linkAcompanhamento);
    } catch (err) {
        console.error(err);
        alert('Erro de conexão com o servidor');
    }
}
/* ======================================================
    🔹 SOCKET
====================================================== */
function conectarSocket(link) {
    if (socket) socket.disconnect();

    socket = io('https://lanchonete-system-web-backend.onrender.com');
    socket.emit('join-pedido', link);

    socket.on('statusUpdate', data => {
        const el = document.getElementById('statusPedido');
        if (el) {
            const statusMap = {
                'aguardando_pagamento': '🕒 Aguardando Pagamento...',
                'pago': '✅ Pago - Em Preparação',
                'preparando': '🍳 Cozinhando...',
                'pronto': '🛵 Pronto para Retirada!',
                'entregue': '🏁 Finalizado'
            };
            el.textContent = statusMap[data.status] || data.status;
        }
    });
}

/* ======================================================
    🔹 NOTIFICAÇÃO
====================================================== */
function mostrarNotificacao(msg) {
    // Cria o alert
    const toast = document.createElement('div');
    toast.className = 'alert alert-success alert-dismissible fade show position-fixed top-50 start-50 translate-middle';
    toast.style.zIndex = '9999';
    toast.style.minWidth = '250px';
    toast.style.textAlign = 'center';
    toast.innerHTML = `
      <i class="bi bi-check-circle-fill me-2"></i>
      ${msg}
    `;
  
    // Adiciona ao body
    document.body.appendChild(toast);
  
    // Remove após 2 segundos
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 150);
    }, 2000);
  }
/* ======================================================
    🔹 INIT
====================================================== */
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    atualizarCarrinhoUI();
});