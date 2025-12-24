const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const QRCode = require('qrcode');

// Verifique se o caminho do seu Model está correto (raiz ou models)
const Pedido = require('../models/Pedido'); 

const PIX_KEY = 'ejimmysmith@gmail.com';
const MERCHANT_NAME = 'Lanchonete Online';
const MERCHANT_CITY = 'SAO PAULO';

// Função auxiliar para gerar o código PIX sem depender de bibliotecas externas problemáticas
function gerarCopiaCola(chave, nome, cidade, valor, txtId = 'LANCHONETE') {
    const format = (id, val) => id + String(val.length).padStart(2, '0') + val;
    
    let payload = [
        format('00', '01'), // Payload Format Indicator
        format('26', format('00', 'br.gov.bcb.pix') + format('01', chave)), // Merchant Account Info
        format('52', '0000'), // Merchant Category Code
        format('53', '986'), // Currency (BRL)
        format('54', Number(valor).toFixed(2)), // Transaction Amount
        format('58', 'BR'), // Country Code
        format('59', nome.substring(0, 25)), // Merchant Name
        format('60', cidade.substring(0, 15)), // Merchant City
        format('62', format('05', txtId)), // Additional Data Field (TXID)
        '6304' // CRC16 Start
    ].join('');

    // Cálculo simples de CRC16 para PIX
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= (payload.charCodeAt(i) << 8);
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : (crc << 1);
        }
    }
    const finalCrc = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    return payload + finalCrc;
}

router.post('/', async (req, res) => {
    try {
        const { items, clienteNome, clienteTelefone, enderecoEntrega } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Carrinho vazio.' });
        }

        const totalCalculado = items.reduce((acc, item) => {
            return acc + (Number(item.precoUnitario) * Number(item.quantidade));
        }, 0);

        const linkAcompanhamento = crypto.randomBytes(10).toString('hex');

        const copiaCola = gerarCopiaCola(PIX_KEY, MERCHANT_NAME, MERCHANT_CITY, totalCalculado);
        const qrCodeBase64 = await QRCode.toDataURL(copiaCola);

        const novoPedido = new Pedido({
            items: items.map(item => ({
                produtoId: item.produtoId,
                quantidade: item.quantidade,
                precoUnitario: item.precoUnitario,
                nome: item.nome
            })),
            total: Number(totalCalculado),
            clienteNome,
            clienteTelefone,
            enderecoEntrega, // ← agora vai pro banco
            linkAcompanhamento,
            pixCopiaCola: copiaCola,
            pixQrCode: qrCodeBase64.replace(/^data:image\/png;base64,/, ''),
            status: 'aguardando_pagamento'
        });

        await novoPedido.save();

        res.status(201).json({
            pixQrCode: novoPedido.pixQrCode,
            pixCopiaCola: novoPedido.pixCopiaCola,
            linkAcompanhamento: novoPedido.linkAcompanhamento,
            pedidoId: novoPedido._id
        });

    } catch (error) {
        console.error('❌ Erro ao criar pedido:', error);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

router.get('/status/:link', async (req, res) => {
    try {
        const pedido = await Pedido.findOne({ linkAcompanhamento: req.params.link });
        if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado.' });
        res.json({ status: pedido.status });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar status.' });
    }
});

module.exports = router;