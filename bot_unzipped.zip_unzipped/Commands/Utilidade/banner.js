const Discord = require("discord.js");
const User = require("../../Modules/Schemas/User");

const lojaDeBanners = {
  '01': {
    nome: 'Uma paisagem qualquer',
    emoji: '🏞️',
    url: 'https://imgur.com/qw7jh7V.jpeg',
    preco: 2000
  },
  '02': {
    nome: 'Gnominha',
    emoji: '🍄',
    url: 'https://i.imgur.com/KFePxns.png',
    preco: 10500
  },
  '03': {
    nome: 'Noite',
    emoji: '🌙',
    url: 'https://i.imgur.com/znaysLg.png',
    preco: 15000
  }
};

module.exports = {
  name: 'banner',
  description: 'Veja todos os banners disponíveis na loja!',
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    const banners = Object.entries(lojaDeBanners);
    let index = 0;

    let userData = await User.findOne({ userId: interaction.user.id });
    if (!userData) userData = await User.create({ userId: interaction.user.id });

    const gerarEmbed = () => {
      const [id, banner] = banners[index];
      const comprado = userData.bannersComprados.includes(id);
      const equipado = userData.banner === banner.url;

      return new Discord.EmbedBuilder()
        .setColor('Blue')
        .setTitle(`${banner.emoji} **${banner.nome}**`)
        .setDescription(
          `**ID:** ${id}\n` +
          `<:rubi:1369325451532697620>**Preço:** ${banner.preco} rubis\n\n` +
          `**Status:** ${equipado ? 'Equipado ✅' : comprado ? 'Já comprado <:rubi:1369325451532697620>' : 'Não comprado ❌'}\n\n` +
          `<:rubi:1369325451532697620>**Saldo de rubis:** ${userData.coins} rubis\n\n` +
          `Clique em "Comprar" para adquirir esse banner.`
        )
        .setImage(banner.url)
        .setFooter({ text: `Banner ${index + 1} de ${banners.length}` });
    };

    const getButtons = () => {
      const [id] = banners[index];
      return new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
          .setCustomId('anterior')
          .setEmoji('left:1369321418365472919')
          .setStyle(Discord.ButtonStyle.Secondary)
          .setDisabled(index === 0),
        new Discord.ButtonBuilder()
          .setCustomId('comprar')
          .setLabel(userData.bannersComprados.includes(id) ? 'Equipar' : 'Comprar')
          .setStyle(Discord.ButtonStyle.Success),
        new Discord.ButtonBuilder()
          .setCustomId('proximo')
          .setEmoji('rightarrow:1369321482274209812')
          .setStyle(Discord.ButtonStyle.Secondary)
          .setDisabled(index === banners.length - 1)
      );
    };

    await interaction.reply({
      embeds: [gerarEmbed()],
      components: [getButtons()]
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 60000
    });

    collector.on('collect', async i => {
      if (i.customId === 'proximo') index++;
      if (i.customId === 'anterior') index--;

      if (i.customId === 'comprar') {
        const [id, banner] = banners[index];
        if (!userData.bannersComprados.includes(id)) {
          if (userData.coins < banner.preco) {
            return i.reply({
              content: `Você não tem rubis suficientes! Preço: **${banner.preco}** rubis.`,
              ephemeral: true
            });
          }

          userData.coins -= banner.preco;
          userData.bannersComprados.push(id);
        }

        userData.banner = banner.url;
        await userData.save();

        return i.reply({
          content: userData.bannersComprados.includes(id)
            ? `Você **equipou** o banner **${banner.nome}** com sucesso! 🎉`
            : `Você **comprou e equipou** o banner **${banner.nome}** com sucesso! 🎉`,
          ephemeral: true
        });
      }

      await i.update({
        embeds: [gerarEmbed()],
        components: [getButtons()]
      });
    });

    collector.on('end', () => {
      const finalRow = new Discord.ActionRowBuilder().addComponents(
        getButtons().components.map(b => b.setDisabled(true))
      );
      interaction.editReply({ components: [finalRow] }).catch(() => {});
    });
  }
};