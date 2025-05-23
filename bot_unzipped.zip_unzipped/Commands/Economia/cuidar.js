const { EmbedBuilder } = require('discord.js');
const User = require('../../Modules/Schemas/User');

module.exports = {
  name: 'cuidar',
  description: 'Cuide dos seus filhos e fortaleça os laços!',
  type: 1, // ChatInput

  run: async (client, interaction) => {
    const userId = interaction.user.id;
    const userData = await User.findOne({ userId });

    if (!userData) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ Dados não encontrados!')
          .setDescription('Você ainda não tem perfil no sistema.')],
        ephemeral: true
      });
    }

    const parceiroId = userData.marriedTo;
    let parceiroData = null;
    if (parceiroId) {
      parceiroData = await User.findOne({ userId: parceiroId });
    }

    const filhosUsuario = userData.filhos || [];
    const filhosParceiro = parceiroData?.filhos || [];

    const totalFilhos = filhosUsuario.length + filhosParceiro.length;

    if (totalFilhos === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('Yellow')
          .setTitle('👶 Nenhum filho encontrado!')
          .setDescription('Você ainda não tem filhos para cuidar. Use `/gf` para tentar formar uma família!')],
        ephemeral: true
      });
    }

    const agora = Date.now();
    const cooldown = 1000 * 60 * 30; // 30 minutos

    if (userData.lastCare && agora - userData.lastCare < cooldown) {
      const restante = cooldown - (agora - userData.lastCare);
      const minutos = Math.floor(restante / (1000 * 60));
      const segundos = Math.floor((restante % (1000 * 60)) / 1000);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('Orange')
          .setTitle('⏳ Calma aí!')
          .setDescription(`Você já cuidou dos seus filhos recentemente.\nTente novamente em **${minutos}m ${segundos}s**.`)],
        ephemeral: true
      });
    }

    const recompensa = Math.floor(Math.random() * 101) + 200; // 200 a 300
    userData.coins += recompensa;
    userData.lastCare = agora;
    await userData.save();

    interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor('Green')
        .setTitle('✨ Momento especial!')
        .setDescription(`Você cuidou com carinho de seus ${totalFilhos} filho(s) e recebeu \`${recompensa} rubis 💎\` pela dedicação!`)]
    });
  }
};