const Discord = require("discord.js");
const cor = require('../../config.js').discord.color;
const User = require('../../Modules/Database/User');
const ms = require('ms');

module.exports = {
  name: 'apostar',
  description: 'Aposte rubis com um usuário.',
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'usuário',
      description: 'Mencione um usuário.',
      type: Discord.ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: 'rubis',
      description: 'Quantidade de rubis para apostar.',
      type: Discord.ApplicationCommandOptionType.Number,
      required: true,
    }
  ],

  run: async (client, interaction) => {
    const user1 = interaction.user;
    const user2 = interaction.options.getUser('usuário');
    const valor = Math.floor(interaction.options.getNumber('rubis'));
    const db = new User();

    try {
      const [data1, data2] = await Promise.all([
        db.find(user1.id),
        db.find(user2.id)
      ]);

      const embed = new Discord.EmbedBuilder().setColor(cor).setTitle('Aposta');

      // Validações
      const erro =
        !data1 ? 'Você ainda não se cadastrou. Use `/cadastrar`.' :
        user1.id === user2.id ? 'Você não pode apostar com você mesmo.' :
        user2.bot ? 'Você não pode apostar contra bots.' :
        !data2 ? `O usuário ${user2} ainda não se cadastrou.` :
        valor <= 0 ? 'Aposte apenas valores positivos.' :
        data1.coins < valor ? `Você não possui rubis suficientes. Saldo: \`${data1.coins}\`` :
        data2.coins < valor ? `${user2.username} não possui rubis suficientes.` :
        null;

      if (erro) {
        return interaction.reply({ embeds: [embed.setDescription(`❌ ${erro}`)], ephemeral: true });
      }

      const embedAposta = new Discord.EmbedBuilder()
        .setColor(cor)
        .setTitle('🤝 Desafio de Aposta!')
        .setDescription(
          `**${user1.username}** desafiou **${user2.username}** para apostar \`${valor}\` rubis!\n\n` +
          `> ${user2}, clique no botão abaixo para aceitar.\n\n` +
          `A aposta expira em 1 minuto.`
        );

      const row = new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
          .setCustomId(`${interaction.id}-aposta`)
          .setLabel('Aceitar Aposta')
          .setEmoji('🎲')
          .setStyle(Discord.ButtonStyle.Success)
      );

      await interaction.reply({ embeds: [embedAposta], components: [row] });

      const filter = i => i.user.id === user2.id && i.customId === `${interaction.id}-aposta`;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: ms('1m'), max: 1 });

      collector.on('collect', async i => {
        await i.deferUpdate();

        await interaction.editReply({
          embeds: [new Discord.EmbedBuilder()
            .setColor(cor)
            .setTitle('🔄 Aposta em andamento...')
            .setDescription(`Aposta aceita por **${user2.username}**!\nResultado em 5 segundos...`)
          ],
          components: []
        });

        setTimeout(async () => {
          const vencedor = Math.random() < 0.5 ? user1 : user2;
          const perdedor = vencedor.id === user1.id ? user2 : user1;
          const vencedorData = vencedor.id === user1.id ? data1 : data2;
          const perdedorData = vencedor.id === user1.id ? data2 : data1;

          vencedorData.coins += valor;
          perdedorData.coins -= valor;

          await Promise.all([vencedorData.save(), perdedorData.save()]);

          const embedResultado = new Discord.EmbedBuilder()
            .setColor(cor)
            .setTitle('✅ Resultado da Aposta!')
            .setDescription(
              `🎉 **${vencedor.username}** venceu a aposta!\n` +
              `💰 Ganhou \`${valor}\` rubis de **${perdedor.username}**.`
            );

          await interaction.editReply({ embeds: [embedResultado] });
        }, ms('5s'));
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          const cancelEmbed = new Discord.EmbedBuilder()
            .setColor(cor)
            .setTitle('⌛ Aposta cancelada')
            .setDescription(`O tempo expirou e **${user2.username}** não aceitou a aposta.`);

          interaction.editReply({ embeds: [cancelEmbed], components: [] });
        }
      });

    } catch (err) {
      console.error(err);
      db.sendErrorMessage(interaction, 'apostar');
    }
  }
};