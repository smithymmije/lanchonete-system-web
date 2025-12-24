require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

// DISPONIBILIZA O IO PARA AS ROTAS
app.set('io', io);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Importante para receber dados do MP
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conectar MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Erro MongoDB:', err));

// ROTAS
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/produtos', require('./src/routes/produtos'));
app.use('/api/pedidos', require('./src/routes/pedidos'));
app.use('/api/admin', require('./src/routes/admin'));


// Sockets
require('./src/sockets/pedidoSockets')(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));