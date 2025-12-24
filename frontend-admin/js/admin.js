//const API_URL = 'http://localhost:4000/api';
const API_URL = 'https://lanchonete-system-web-backend.onrender.com/api';

// ==========================================
// 🔐 AUTH HEADERS (CORRIGIDO)
// ==========================================
function authHeaders(extra = {}) {
    return {
        Authorization: localStorage.getItem('token'),
        ...extra
    };
}


// ==========================================
// 🛡️ TRAVA DE SEGURANÇA
// ==========================================
const estaNaPaginaDeLogin = window.location.pathname.includes('login.html');
if (!localStorage.getItem('token') && !estaNaPaginaDeLogin) {
    window.location.href = 'login.html';
}

let pedidos = [];
let produtos = [];

// =======================
// LOGIN / LOGOUT
// =======================
function fazerLogin() {
    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;
    if (!usuario || !senha) return alert('Preencha usuário e senha!');

    fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha })
    })
    .then(res => res.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            window.location.href = 'index.html';
        } else {
            alert(data.erro || 'Login inválido');
        }
    })
    .catch(() => alert('Erro ao conectar no servidor'));
}

function fazerLogout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// =======================
// NAVEGAÇÃO
// =======================
function mostrarPedidos() {
    atualizarLinksNav(0);
    esconderSecoes();
    document.getElementById('pedidosSection').style.display = 'block';
    carregarPedidos();
}

function mostrarProdutos() {
    atualizarLinksNav(1);
    esconderSecoes();
    document.getElementById('produtosSection').style.display = 'block';
    carregarProdutos();
}

function mostrarNovoProduto() {
    atualizarLinksNav(2);
    esconderSecoes();
    document.getElementById('novoProdutoSection').style.display = 'block';
}

function esconderSecoes() {
    document.getElementById('pedidosSection').style.display = 'none';
    document.getElementById('produtosSection').style.display = 'none';
    document.getElementById('novoProdutoSection').style.display = 'none';
}

function atualizarLinksNav(index) {
    const links = document.querySelectorAll('.nav-link');
    links.forEach(l => l.classList.remove('active'));
    if (links[index]) links[index].classList.add('active');
}

// =======================
// CARREGAR DADOS
// =======================
function carregarPedidos() {
    fetch(`${API_URL}/admin/pedidos`, {
        headers: authHeaders()
    })
    .then(res => res.json())
    .then(data => {
        pedidos = data;
        exibirPedidos();
    })
    .catch(err => console.error('Erro pedidos:', err));
}

function carregarProdutos() {
    fetch(`${API_URL}/admin/produtos`, {
        headers: authHeaders()
    })
    .then(res => res.json())
    .then(data => {
        produtos = data;
        exibirProdutos();
    })
    .catch(err => console.error('Erro produtos:', err));
}

// =======================
// PEDIDOS
// =======================
function exibirPedidos() {
    const container = document.getElementById('pedidosContainer');
    container.innerHTML = '';

    if (pedidos.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Nenhum pedido.</p>';
        return;
    }

    pedidos.forEach(p => {
        container.innerHTML += `
        <div class="card mb-3 shadow-sm">
            <div class="card-body">
                <h5 class="text-danger">Pedido #${p._id.slice(-6)}</h5>
                <p><strong>Cliente:</strong> ${p.clienteNome}</p>
                <p><strong>Total:</strong> R$ ${p.total.toFixed(2)}</p>
                <span class="badge bg-${getStatusColor(p.status)}">${getStatusText(p.status)}</span>
                <div class="mt-3">${getStatusButtons(p)}</div>
            </div>
        </div>`;
    });
}

function atualizarStatus(id, status) {
    fetch(`${API_URL}/admin/pedidos/${id}/status`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status })
    }).then(() => carregarPedidos());
}

// =======================
// PRODUTOS COM BOTÕES
// =======================
function exibirProdutos() {
    const container = document.getElementById('produtosContainer');
    container.innerHTML = '<div class="row"></div>';
    const row = container.querySelector('.row');

    produtos.forEach(p => {
        row.innerHTML += `
        <div class="col-md-4 mb-4">
            <div class="card shadow-sm h-100">
                <img src="${p.imagem ? `${API_URL.replace('/api','')}/uploads/${p.imagem}` : 'https://via.placeholder.com/300'}"
                     class="card-img-top" style="height:180px;object-fit:cover">
                <div class="card-body">
                    <h5>${p.nome}</h5>
                    <p class="text-muted small">${p.descricao || ''}</p>
                    <strong class="text-danger">R$ ${p.preco.toFixed(2)}</strong>

                    <div class="d-flex justify-content-between mt-3">
                        <button class="btn btn-sm btn-outline-primary" onclick="editarProduto('${p._id}')">✏️ Editar</button>
                        <button class="btn btn-sm ${p.disponivel ? 'btn-outline-warning' : 'btn-outline-success'}"
                                onclick="alternarDisponibilidade('${p._id}', ${!p.disponivel})">
                            ${p.disponivel ? '⏸️ Pausar' : '▶️ Ativar'}
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="excluirProduto('${p._id}')">🗑️ Excluir</button>
                    </div>

                    <div class="mt-2">
                        <span class="badge bg-${p.disponivel ? 'success' : 'secondary'}">
                            ${p.disponivel ? 'Ativo' : 'Pausado'}
                        </span>
                    </div>
                </div>
            </div>
        </div>`;
    });
}

// =======================
// FUNÇÕES DE PRODUTO
// =======================
function editarProduto(id) {
    const p = produtos.find(prod => prod._id === id);
    if (!p) return;

    document.getElementById('produtoNome').value = p.nome;
    document.getElementById('produtoDescricao').value = p.descricao || '';
    document.getElementById('produtoPreco').value = p.preco;
    document.getElementById('produtoCategoria').value = p.categoria;

    document.getElementById('produtoForm').dataset.editando = id;

    const titulo = document.querySelector('#novoProdutoSection h3');
    if (titulo) titulo.textContent = 'Editar Produto';

    mostrarNovoProduto();
}

async function alternarDisponibilidade(id, disponivel) {
    const res = await fetch(`${API_URL}/admin/produtos/${id}/disponivel`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ disponivel })
    });

    if (res.ok) carregarProdutos();
    else alert('Erro ao alterar disponibilidade');
}

async function excluirProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    const res = await fetch(`${API_URL}/admin/produtos/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });

    if (res.ok) carregarProdutos();
    else alert('Erro ao excluir produto');
}

// =======================
// FORMULÁRIO (POST / PUT)
// =======================
const formProd = document.getElementById('produtoForm');

if (formProd) {
    formProd.addEventListener('submit', async e => {
        e.preventDefault();

        const formData = new FormData(formProd);
        const editandoId = formProd.dataset.editando;

        if (!formData.get('imagem') && editandoId) {
            formData.delete('imagem');
        }

        const url = editandoId
            ? `${API_URL}/admin/produtos/${editandoId}`
            : `${API_URL}/admin/produtos`;

        const method = editandoId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: authHeaders(),
            body: formData
        });

        if (res.ok) {
            alert(editandoId ? 'Produto atualizado!' : 'Produto cadastrado!');
            formProd.reset();
            delete formProd.dataset.editando;
            const titulo = document.querySelector('#novoProdutoSection h3');
            if (titulo) titulo.textContent = 'Cadastrar Novo Produto';
            mostrarProdutos();
        } else {
            const data = await res.json();
            alert(data.erro || 'Erro ao salvar produto');
        }
    });
}

// =======================
// HELPERS
// =======================
function getStatusColor(s) {
    return {
        aguardando_pagamento: 'warning',
        pago: 'info',
        preparando: 'primary',
        pronto: 'success',
        saiu_entrega: 'info',   // azul claro
        entregue: 'secondary'   // cinza
    }[s] || 'dark';
}

function getStatusText(s) {
    return {
        aguardando_pagamento: 'Aguardando',
        pago: 'Pago',
        preparando: 'Preparando',
        pronto: 'Pronto',
        saiu_entrega: 'Saiu p/ Entrega',
        entregue: 'Entregue'
    }[s] || s;
}

function getStatusButtons(p) {
    const map = {
        aguardando_pagamento: `<button class="btn btn-warning btn-sm" onclick="atualizarStatus('${p._id}','pago')">Confirmar</button>`,
        pago: `<button class="btn btn-primary btn-sm" onclick="atualizarStatus('${p._id}','preparando')">Produção</button>`,
        preparando: `<button class="btn btn-success btn-sm" onclick="atualizarStatus('${p._id}','pronto')">Pronto</button>`,
        pronto: `<button class="btn btn-info btn-sm" onclick="atualizarStatus('${p._id}','saiu_entrega')">Saiu p/ Entrega</button>`,
        saiu_entrega: `<button class="btn btn-secondary btn-sm" onclick="atualizarStatus('${p._id}','entregue')">Entregue</button>`
    };
    return map[p.status] || '';
}

// =======================
// INICIALIZAÇÃO
// =======================
window.onload = () => {
    if (localStorage.getItem('token')) {
        carregarPedidos();
    }
};
