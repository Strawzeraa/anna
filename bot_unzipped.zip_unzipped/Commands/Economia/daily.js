const Discord = require("discord.js");
const cor = require('../../config.js').discord.color;
const config = require('../../config.js');
const User = require("../../Modules/Database/User");

module.exports = {
  name: 'daily',
  description: 'Resgate suas rubis diárias.',
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    const userId = interaction.user.id;
    const serverId = interaction.guildId;
    const database = new User();

    try {
      const userDatabase = await database.find(userId);

      if (!userDatabase) {
        database.sendUndefinedUserMessage(interaction, interaction.user);
        return;
      }

      const lastDaily = userDatabase.lastDaily || 0;
      const now = Date.now();
      const miliseconds = 24 * 60 * 60 * 1000;

      if (now - new Date(lastDaily).getTime() < miliseconds) {
        const nextDailyTimestamp = Math.floor((new Date(lastDaily).getTime() + miliseconds) / 1000);

        const embed = new Discord.EmbedBuilder()
          .setColor(cor)
          .setTitle('<:rubi:1369325451532697620> Resgate Diário Bloqueado')
          .setDescription(`**Você já coletou suas rubis hoje!**  
⏳ Tente novamente <t:${nextDailyTimestamp}:R> para receber mais.`)
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: 'Dica: volte todo dia para maximizar seus ganhos!' });

        return interaction.reply({ embeds: [embed] });
      }

      let dailyReward = Math.floor(Math.random() * 1501) + 500; // 500 a 2000
      const isVerified = config.discord.verifiedServers.includes(serverId);

      if (isVerified) dailyReward = Math.floor(dailyReward * 1.3);

      userDatabase.coins += dailyReward;
      userDatabase.lastDaily = new Date();
      await userDatabase.save();

      // Estética da recompensa
      const rubiEmoji = '<:rubi:1369325451532697620>';
      let destaque = '';
      let extraEmoji = '';

      if (dailyReward >= 1800) {
        destaque = '✨ Uau, que sorte!';
        extraEmoji = '🌟';
      } else if (dailyReward >= 1200) {
        destaque = '🔮 Um ótimo dia para rubis!';
        extraEmoji = '💖';
      } else if (dailyReward <= 700) {
        destaque = '🥄 Nem todo dia é de fartura, mas não desista!';
        extraEmoji = '🪙';
      }

      const embed = new Discord.EmbedBuilder()
        .setColor(cor)
        .setTitle(`${rubiEmoji} Resgate Diário`)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setDescription(
          `**Olá, ${interaction.user.username}!**  
Você resgatou suas rubis diárias com sucesso! ${extraEmoji}

${destaque ? `> ${destaque}\n` : ''}
${isVerified ? '✅ Servidor Verificado! Você ganhou **30% a mais!**' : '⚠️ Este servidor **não é verificado**.'}

**Recompensa:** ${rubiEmoji} \`${dailyReward.toLocaleString()}\` rubis  
**Saldo Atual:** \`${userDatabase.coins.toLocaleString()}\` rubis`
        )
        .setFooter({ text: 'Volte amanhã para mais recompensas diárias!' });

      interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      database.sendErrorMessage(interaction, 'daily');
    }
  }
};