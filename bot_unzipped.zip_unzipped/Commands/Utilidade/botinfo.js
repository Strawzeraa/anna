const { EmbedBuilder } = require('discord.js');
const moment = require('moment');

// Configura o idioma para português
moment.locale('pt-br');

module.exports = {
  name: 'botinfo',
  description: 'Mostra informações detalhadas sobre mim!',
  type: 1,

  run: async (client, interaction) => {
    try {
      await interaction.deferReply();

      const botUser = client.user;
      const uptime = moment.duration(client.uptime);
      const formatUptime = `${uptime.hours()}h ${uptime.minutes()}m ${uptime.seconds()}s`;
      const createdAt = moment(botUser.createdAt).format('D [de] MMMM [de] YYYY'); // Data com mês em português

      const embed = new EmbedBuilder()
        .setColor('#FF6F91') // Rosa vibrante e moderno
        .setTitle('💖 **Sobre mim**')
        .setThumbnail(botUser.displayAvatarURL())
        .setDescription('**Olá! Eu sou a Anna!**\nAqui estão algumas informações sobre mim e como você pode aproveitar ao máximo os meus recursos! ✨')
        .addFields(
          { name: '🤩 **Meu nome**', value: `**${botUser.username}**`, inline: true },
          { name: '👨‍💻 **Criador**', value: '<@811033732504223754>', inline: true },
          { name: '⏳ **Tempo online**', value: formatUptime, inline: true },
          { name: '📅 **Criação**', value: createdAt, inline: true },
          { name: '🌐 **Servidores**', value: `${client.guilds.cache.size.toLocaleString() || '0'}`, inline: true },
          { name: '👥 **Usuários**', value: `${client.users.cache.size.toLocaleString() || '0'}`, inline: true },
          {
            name: '📊 **Banco de dados**',
            value: 'Use o comando `/cadastrar` para começar a usar todos os meus recursos! 💫',
            inline: false
          },
          {
            name: '🔗 **Links úteis**',
            value:
              '🌟 [**Entre no meu servidor!**](https://discord.gg/xPxRcbFcjG)\n' +
              '💖 [**Me adicione ao seu servidor!**](https://discord.com/oauth2/authorize?client_id=1324385087139221597&scope=bot&permissions=278297600)',
            inline: false
          }
        )
        .setFooter({ text: 'Obrigado por me usar! 💕' })
        .setTimestamp()
        .setAuthor({ name: botUser.username, iconURL: botUser.displayAvatarURL() });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Erro ao executar o comando /botinfo:', error);
    }
  }
};