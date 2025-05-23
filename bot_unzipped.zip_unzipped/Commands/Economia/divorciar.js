const Discord = require('discord.js');
const User = require('../../Modules/Schemas/User');

module.exports = {
  name: 'divorciar',
  description: 'Encerre seu relacionamento com muito respeito (ou não)',
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    const user = interaction.user;
    const userData = await User.findOne({ userId: user.id });

    if (!userData || !userData.marriedTo) {
      return interaction.reply({ content: 'Você não está casada(o) com ninguém no momento.', ephemeral: true });
    }

    const parceiroID = userData.marriedTo;
    const parceiroData = await User.findOne({ userId: parceiroID });

    if (!parceiroData || parceiroData.marriedTo !== user.id) {
      // Corrige casamento quebrado
      userData.marriedTo = null;
      await userData.save();
      return interaction.reply({ content: 'Seu relacionamento estava inconsistente e foi encerrado.', ephemeral: true });
    }

    const parceiro = await client.users.fetch(parceiroID);

    const row = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setCustomId('confirmar_divorcio')
        .setLabel('Confirmar divórcio')
        .setStyle(Discord.ButtonStyle.Danger)
    );

    const msg = await interaction.reply({
      content: `Você tem certeza que deseja se divorciar de **${parceiro.username}**? Isso é para sempre...`,
      components: [row],
      ephemeral: true,
      fetchReply: true
    });

    const filtro = i => i.customId === 'confirmar_divorcio' && i.user.id === user.id;

    try {
      const resposta = await msg.awaitMessageComponent({ filter: filtro, time: 20000 });

      userData.marriedTo = null;
      parceiroData.marriedTo = null;
      await userData.save();
      await parceiroData.save();

      await resposta.update({
        content: `O divórcio foi concluído. Que venham novos começos! **Adeus, ${parceiro.username}...**`,
        components: []
      });

    } catch {
      await msg.edit({
        content: 'O tempo acabou e o divórcio foi cancelado. Talvez ainda exista uma chance...',
        components: []
      });
    }
  }
};