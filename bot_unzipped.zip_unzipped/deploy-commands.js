const { REST, Routes } = require('discord.js');
const fs = require('fs').promises;
const config = require('./config');

const commands = [];

async function loadCommands() {
    const folders = await fs.readdir('./Commands');
    for (const folder of folders) {
        const files = await fs.readdir(`./Commands/${folder}`);
        for (const file of files) {
            if (!file.endsWith('.js')) continue;

            const command = require(`./Commands/${folder}/${file}`);
            if (command && command.name && command.description) {
                commands.push(command);
            }
        }
    }
}

(async () => {
    try {
        await loadCommands();

        const rest = new REST({ version: '10' }).setToken(config.discord.token);

        console.log('🔁 Atualizando comandos globalmente...');
        await rest.put(
            Routes.applicationCommands(config.discord.clientId),
            { body: commands }
        );
        console.log(`✅ Comandos atualizados com sucesso! Total: ${commands.length}`);
    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
})();