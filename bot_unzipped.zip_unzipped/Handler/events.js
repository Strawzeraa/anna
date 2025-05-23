const fs = require('fs');
const path = require('path');

function listarArquivos(dir, arquivos, pastaPai, objectEventos, client) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);

    if (fs.statSync(filePath).isDirectory()) {
      listarArquivos(filePath, arquivos, file, objectEventos, client);
    } else if (file.endsWith('.js')) {
      const eventModule = require(filePath);
      const eventName = eventModule.name;

      arquivos.push(`${pastaPai}/${file}`);

      if (typeof eventModule.execute === 'function') {
        if (eventName === 'ready' && objectEventos.readyExecuted) return;

        // Corrigida a ordem dos parâmetros: (...args, client)
        if (eventModule.once) {
          client.once(eventName, (...args) => eventModule.execute(...args, client));
        } else {
          client.on(eventName, (...args) => eventModule.execute(...args, client));
        }

        if (eventName === 'ready') objectEventos.readyExecuted = true;
      }

      if (!objectEventos[pastaPai]) objectEventos[pastaPai] = [];
      objectEventos[pastaPai].push(eventName);
    }
  });
}

function eventsHandler(client) {
  const eventsPath = path.resolve('./Events');
  let eventNames = [];
  const objectEventos = {};

  listarArquivos(eventsPath, eventNames, 'Events', objectEventos, client);

  const eventosCarregados = [];

  for (let pastaPai in objectEventos) {
    if (Array.isArray(objectEventos[pastaPai])) {
      eventosCarregados.push(`[${pastaPai}: ${objectEventos[pastaPai].join(', ')}]`);
    } else {
      eventosCarregados.push(`[${pastaPai}: Nenhum evento registrado]`);
    }
  }

  console.log(`📁 Eventos Carregados: ${eventosCarregados.join(' - ')}`.yellow);
}

module.exports = eventsHandler;