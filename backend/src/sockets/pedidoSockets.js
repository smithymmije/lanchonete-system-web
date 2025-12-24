module.exports = (io) => {
    io.on('connection', (socket) => {
      console.log('Cliente conectado:', socket.id);
  
      socket.on('join-pedido', (linkAcompanhamento) => {
        socket.join(linkAcompanhamento);
        console.log(`Cliente entrou no pedido: ${linkAcompanhamento}`);
      });
  
      socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
      });
    });
  };