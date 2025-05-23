const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'comandos',
  description: 'Veja todos os comandos disponíveis do bot.',
  type: 1,

  run: async (client, interaction) => {
    const commandsDir = path.join(__dirname, '../'); // Ajuste conforme seu sistema de pastas
    const allCommands = [];

    const readCommands = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          readCommands(fullPath);
        } else if (file.endsWith('.js')) {
          try {
            const cmd = require(fullPath);
            if (cmd.name && cmd.description && cmd.type === 1) {
              allCommands.push(`\`/${cmd.name}\` - ${cmd.description}`);
            }
          } catch (e) {
            console.warn(`Erro ao carregar comando: ${file}`, e.message);
          }
        }
      }
    };

    readCommands(commandsDir);

    const embed = new EmbedBuilder()
      .setTitle('📘 Lista de Comandos')
      .setColor('#f9a8d4')
      .setDescription(allCommands.sort().join('\n') || 'Nenhum comando encontrado.')
      .setFooter({ text: 'Esses são todos os comandos disponíveis atualmente!' });

    await interaction.reply({ embeds: [embed], ephemeral: false });

    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (e) {
        console.log('Não foi possível apagar a resposta do comando /comandos.');
      }
    }, 2 * 60 * 1000);
  }
};