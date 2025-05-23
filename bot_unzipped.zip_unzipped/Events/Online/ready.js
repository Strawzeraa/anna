require('colors');

module.exports = {
  name: 'ready',
  execute: (client) => {
    client.on('ready', () => {
      console.log(`✅ Estou online em [${client.user.username}]`.green);

      // Inicia o sorteio automático de rifas
    });
  }
};