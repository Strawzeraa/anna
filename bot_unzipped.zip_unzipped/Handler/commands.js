const fs = require('fs').promises;
const { REST, Routes, Collection } = require('discord.js');
const config = require('../config');

async function commandsHandler(client) {
    const slashArray = [];
    client.slashCommands = new Collection();

    try {
        const folders = await fs.readdir('./Commands');

        for (const folder of folders) {
            const files = await fs.readdir(`./Commands/${folder}`);
            for (const file of files) {
                if (!file.endsWith('.js')) continue;

                const command = require(`../Commands/${folder}/${file}`);
                if (!command.name) continue;

                // Verificando se o comando tem opções e se cada opção tem 'type' definido
                if (command.options && Array.isArray(command.options)) {
                    command.options.forEach(option => {
                        if (!option.type) {
                            console.error(`❌ Erro: A opção "${option.name}" do comando "${command.name}" não tem o campo "type" definido!`);
                        }
                    });
                }

                client.slashCommands.set(command.name, command);
                slashArray.push(command);
            }
        }

        const rest = new REST({ version: '10' }).setToken(config.discord.token);

        console.log('🔁 Atualizando comandos globalmente (sobrescrevendo todos)...');

        await rest.put(
            Routes.applicationCommands(config.discord.clientId),
            { body: slashArray } // sobrescreve tudo
        );

        console.log(`✅ Comandos registrados com sucesso! Total: ${slashArray.length}`);

    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
}

module.exports = commandsHandler;