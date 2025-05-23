const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../Modules/Schemas/User');

module.exports = {
  name: 'drop',
  description: 'Gere um drop de rubis para o servidor',
  type: 1,
  options: [
    {
      name: 'quantia',
      description: 'Quantia de rubis para o drop (máximo 10000)',
      type: 4,
      required: true
    }
  ],

  run: async (client, interaction) => {
    const quantia = interaction.options.getInteger('quantia');
    const donoId = '811033732504223754';

    if (interaction.user.id !== donoId) {
      return interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
    }

    if (quantia < 100 || quantia > 10000) {
      return interaction.reply({ content: 'A quantia deve ser entre 100 e 10000 rubis.', ephemeral: true });
    }

    const maxReceivers = 3;
    const receivers = [];
    const participantes = new Map();

    const button = new ButtonBuilder()
      .setCustomId('drop_button')
      .setLabel('Clique para receber o drop!')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('💰');

    const row = new ActionRowBuilder().addComponents(button);

    const dropEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('💸 **Drop de Rubis Iniciado!** 💸')
      .setDescription(
        `O dono do bot iniciou um **drop de rubis**!\n\n**Total:** ${quantia} rubis\n**Tempo restante:** 10 segundos\n**Máximo:** 3 pessoas receberão.`
      )
      .setFooter({ text: 'Clique no botão abaixo para participar!', iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [dropEmbed], components: [row], fetchReply: true });

    // Atualização da contagem regressiva
    let segundosRestantes = 10;
    const intervalo = setInterval(async () => {
      segundosRestantes -= 2;
      if (segundosRestantes <= 0) return clearInterval(intervalo);

      dropEmbed.setDescription(
        `O dono do bot iniciou um **drop de rubis**!\n\n**Total:** ${quantia} rubis\n**Tempo restante:** ${segundosRestantes} segundos\n**Máximo:** 3 pessoas receberão.`
      );
      await msg.edit({ embeds: [dropEmbed] });
    }, 2000);

    const filter = (i) => i.customId === 'drop_button' && !receivers.includes(i.user.id);
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 10000 });

    collector.on('collect', async (i) => {
      receivers.push(i.user.id);
      await i.reply({ content: 'Você entrou no drop!', ephemeral: true });

      if (receivers.length >= maxReceivers) collector.stop();
    });

    collector.on('end', async () => {
      clearInterval(intervalo);
      await msg.edit({ components: [] });

      if (receivers.length === 0) {
        return interaction.followUp({ content: 'Ninguém participou do drop.', ephemeral: false });
      }

      // Validação da regra dos 2000+
      if (quantia >= 2000 && receivers.length < 2) {
        return interaction.followUp({ content: 'O drop exigia no mínimo 2 participantes por ser de valor alto (>= 2000). Ninguém recebeu nada.', ephemeral: false });
      }

      const valorPorPessoa = Math.floor(quantia / receivers.length);
      const sobra = quantia % receivers.length;

      for (let i = 0; i < receivers.length; i++) {
        const id = receivers[i];
        const user = await User.findOne({ userId: id });
        if (!user) continue;

        let valorFinal = valorPorPessoa;
        if (sobra > 0 && i === 0) valorFinal += sobra;

        user.coins += valorFinal;
        await user.save();

        participantes.set(id, valorFinal);

        const membro = await interaction.guild.members.fetch(id);
        membro.send(`🎉 Você recebeu **${valorFinal}** rubis do drop! 💎`).catch(() => {});
      }

      // Montar resultado detalhado
      const resultados = [...participantes.entries()].map(([id, valor]) => `<@${id}> recebeu **${valor} rubis**`).join('\n');

      interaction.followUp({
        content: `**Drop finalizado!**\n\n${resultados}`,
        allowedMentions: { users: [] }
      });
    });
  }
};