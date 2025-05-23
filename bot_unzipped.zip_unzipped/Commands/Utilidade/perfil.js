const Discord = require('discord.js');
const User = require('../../Modules/Schemas/User');

module.exports = {
  name: 'perfil',
  description: 'Veja seu perfil completo (rubis, bio, banner etc)',
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'usuário',
      description: 'A pessoa que você quer ver o perfil',
      type: Discord.ApplicationCommandOptionType.User,
      required: false
    }
  ],

  run: async (client, interaction) => {
    const alvo = interaction.options.getUser('usuário') || interaction.user;
    const userData = await User.findOne({ userId: alvo.id });

    if (!userData) {
      return interaction.reply({
        content: 'Essa pessoa ainda não tem perfil no sistema.',
        ephemeral: true
      });
    }

    const rubiEmoji = '<:rubi:1369325451532697620>';
    let casadoCom = 'Solteiro(a) ❤️‍🔥';
    let filhosTotal = userData.filhos?.length || 0;

    if (userData.marriedTo) {
      casadoCom = `<@${userData.marriedTo}> 💍`;

      const parceiroData = await User.findOne({ userId: userData.marriedTo });
      if (parceiroData?.filhos?.length) {
        filhosTotal += parceiroData.filhos.length;
      }
    }

    const embed = new Discord.EmbedBuilder()
      .setColor('#ff69b4')
      .setTitle(`✨ Perfil de ${alvo.username}`)
      .setThumbnail(alvo.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `**Carteira:**\n> ${rubiEmoji} \`${userData.coins.toLocaleString()}\` rubis\n\n` +
        `**Status:**\n> ${casadoCom}\n\n` +
        `**Filhos:**\n> ${filhosTotal > 0 ? `${filhosTotal} filho(s)` : 'Nenhum filho'}\n\n` +
        `**Bio:**\n> ${userData.bio || '*Sem bio definida.*'}`
      )
      .setFooter({ text: 'Personalize com /bio e /banner para deixar seu perfil único!' });

    if (userData.banner) {
      embed.setImage(userData.banner);
    }

    interaction.reply({ embeds: [embed] });
  }
};