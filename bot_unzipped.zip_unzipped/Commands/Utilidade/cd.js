const { EmbedBuilder } = require('discord.js');
const User = require('../../Modules/Schemas/User');

module.exports = {
  name: 'cd',
  description: 'Veja os tempos de espera dos seus comandos.',

  run: async (client, interaction) => {
    const userId = interaction.user.id;
    let userData = await User.findOne({ userId });

    if (!userData) {
      userData = new User({ userId });
      await userData.save();
    }

    const agora = Date.now();

    const formatarTempo = (ms) => {
      const totalSegundos = Math.floor(ms / 1000);
      const horas = Math.floor(totalSegundos / 3600);
      const minutos = Math.floor((totalSegundos % 3600) / 60);
      const segundos = totalSegundos % 60;
      return `${horas}h ${minutos}min ${segundos}s`;
    };

    const formatarTimestamp = (ms) => `<t:${Math.floor(ms / 1000)}:R>`;

    const cooldowns = [
      { nome: 'Diário', cooldown: userData.lastDaily, tempo: 86400000 }, // 24 horas
      { nome: 'Trabalho', cooldown: userData.lastWork, tempo: 3600000 }, // 1 hora
      { nome: 'Investimento', cooldown: userData.lastInvest, tempo: 86400000 }, // 24 horas
      { nome: 'Pesca', cooldown: userData.lastFish, tempo: 21600000 }, // 6 horas
      { nome: 'Cassino', cooldown: userData.lastCasino, tempo: 10800000 }, // 3 horas
      { nome: 'Crime', cooldown: userData.lastCrimeTime, tempo: 10800000 }, // 3 horas
      { nome: 'Corrida', cooldown: userData.lastRaceTime, tempo: 1800000 } // 30 minutos
    ];

    const linhas = cooldowns.map(cmd => {
      const expiracao = cmd.cooldown + cmd.tempo;
      const tempoRestante = expiracao - agora;

      if (tempoRestante > 0) {
        return `**${cmd.nome}**: ${formatarTempo(tempoRestante)} (${formatarTimestamp(expiracao)}) ⏳`;
      } else {
        return `**${cmd.nome}**: Pronto para usar!`;
      }
    });

    const embed = new EmbedBuilder()
      .setTitle('Seus Cooldowns')
      .setDescription(linhas.join('\n'))
      .setColor('#9b59b6')
      .setFooter({ text: 'Aguarde o tempo necessário para cada comando!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};