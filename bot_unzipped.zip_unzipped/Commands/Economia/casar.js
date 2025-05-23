const Discord = require('discord.js');
const User = require('../../Modules/Schemas/User');

module.exports = {
  name: 'casar',
  description: 'Peça alguém em casamento com muito charme!',
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'usuário',
      description: 'Pessoa que você quer pedir em casamento',
      type: Discord.ApplicationCommandOptionType.User,
      required: true
    }
  ],

  run: async (client, interaction) => {
    const autor = interaction.user;
    const parceiro = interaction.options.getUser('usuário');

    if (autor.id === parceiro.id) {
      return interaction.reply({ content: 'Você não pode se casar consigo mesma, né? **Se ame, mas com limites!**', ephemeral: true });
    }

    const autorData = await User.findOne({ userId: autor.id });
    const parceiroData = await User.findOne({ userId: parceiro.id });

    if (!autorData || !parceiroData) {
      return interaction.reply({ content: 'Ambos os usuários precisam ter um perfil registrado no sistema.', ephemeral: true });
    }

    if (autorData.marriedTo || parceiroData.marriedTo) {
      return interaction.reply({ content: 'Hmm... alguém aqui já tem aliança no dedo!', ephemeral: true });
    }

    const row = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setCustomId('aceitar_casamento')
        .setLabel('Sim, aceito! 💍')
        .setStyle(Discord.ButtonStyle.Success),
      new Discord.ButtonBuilder()
        .setCustomId('recusar_casamento')
        .setLabel('Não, obrigado...')
        .setStyle(Discord.ButtonStyle.Danger)
    );

    const msg = await interaction.reply({
      content: `**${parceiro}**, você aceita se casar com **${autor}**? **É agora ou nunca!**`,
      components: [row],
      fetchReply: true
    });

    const filtro = i =>
      ['aceitar_casamento', 'recusar_casamento'].includes(i.customId) &&
      i.user.id === parceiro.id;

    try {
      const resposta = await msg.awaitMessageComponent({ filter: filtro, time: 60000 });

      if (resposta.customId === 'aceitar_casamento') {
        autorData.marriedTo = parceiro.id;
        parceiroData.marriedTo = autor.id;
        await autorData.save();
        await parceiroData.save();

        await resposta.update({
          content: `**Parabéns!** ${autor} e ${parceiro} agora estão oficialmente casados! **Muita felicidade ao casal!** 💞`,
          components: []
        });
      } else {
        await resposta.update({
          content: `${parceiro} gentilmente recusou o pedido... **fica pra próxima, ${autor}!**`,
          components: []
        });
      }

    } catch {
      await msg.edit({
        content: 'O tempo acabou e o pedido de casamento foi cancelado. **Talvez o destino não quisesse...**',
        components: []
      });
    }
  }
};