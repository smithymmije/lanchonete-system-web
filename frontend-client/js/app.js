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

        // 🔥 GARANTE QUE PREÇO SEJA NUMBER
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
    🔹 EXIBIR PRODUTOS
====================================================== */
function exibirProdutos(produtosFiltrados) {
    const container = document.getElementById('produtosContainer');
    if (!container) return;

    container.innerHTML = '';

    produtosFiltrados.forEach(produto => {
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
                        <button class="btn btn-danger w-100"
                            onclick="adicionarCarrinho('${produto._id}')">
                            Adicionar ao Carrinho
                        </button>
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
            categoria === 'todos' || card.dataset.categoria === categoria
                ? 'block'
                : 'none';
    });
}

/* ======================================================
    🔹 CARRINHO
====================================================== */
function adicionarCarrinho(produtoId) {
    const produto = produtos.find(p => p._id === produtoId);
    if (!produto) return;

    const existente = carrinho.find(i => i.produtoId === produtoId);

    if (existente) {
        existente.quantidade++;
    } else {
        carrinho.push({
            produtoId: produto._id,
            nome: produto.nome,
            preco: Number(produto.preco), // 🔥 FORÇA NUMBER
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
    
    // Pequeno ajuste para abrir o modal corretamente
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
    🔹 FINALIZAR PEDIDO (PIX DIRETO)
====================================================== */
async function finalizarPedido() {
    if (carrinho.length === 0) {
        alert('Carrinho vazio!');
        return;
    }

    const nome = prompt('Digite seu nome:');
    const telefone = prompt('Digite seu telefone:');

    if (!nome) return alert('Nome obrigatório');

    // 🔥 TOTAL CALCULADO
    const total = carrinho.reduce(
        (acc, item) => acc + (Number(item.preco) * Number(item.quantidade)),
        0
    );

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
                total: total, // 🔥 LINHA ADICIONADA: Agora envia o valor para o seu Pix próprio
                clienteNome: nome,
                clienteTelefone: telefone
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Erro ao gerar Pix');
            return;
        }

        // Exibe os dados do PIX gerados pela sua chave ejimmysmith@gmail.com
        document.getElementById('qrCode').src = `data:image/png;base64,${data.pixQrCode}`;
        document.getElementById('copiaCola').textContent = data.pixCopiaCola;

        document.getElementById('linkAcompanhamento').href = `/pedido.html?id=${data.linkAcompanhamento}`;

        // Limpeza
        carrinho = [];
        salvarCarrinho();
        atualizarCarrinhoUI();

        // Troca os modais
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

    //socket = io('http://localhost:4000');
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
    const toast = document.createElement('div');
    toast.className = 'toast show position-fixed top-0 end-0 m-3 bg-dark text-white';
    toast.style.zIndex = "9999";
    toast.innerHTML = `<div class="toast-body">${msg}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

/* ======================================================
    🔹 INIT
====================================================== */
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    atualizarCarrinhoUI();
});