const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const cor = require('../../config.js');

module.exports = {
  name: 'userinfo',
  description: 'Veja informações completas de um usuário!',
  type: 1,
  options: [
    {
      name: 'usuário',
      description: 'Usuário desejado',
      type: 6,
      required: false
    }
  ],

  async run(client, interaction) {
    const user = interaction.options.getUser('usuário') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    await interaction.deferReply();

    const baseEmbed = new EmbedBuilder()
      .setColor(cor.color || '#FFB6C1')
      .setAuthor({ name: `Informações de ${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🆔 ID', value: `\`${user.id}\``, inline: true },
        { name: '📅 Conta criada em', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:f>`, inline: true },
        { name: '📌 Entrou no servidor', value: member?.joinedAt ? `<t:${Math.floor(member.joinedAt / 1000)}:f>` : 'Não encontrado', inline: true },
        { name: '📱 Status', value: member?.presence?.status || 'Offline', inline: true }
      )
      .setFooter({ text: `Comando solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

    const selectRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('userinfo_menu')
        .setPlaceholder('Escolha uma visualização extra')
        .addOptions(
          {
            label: 'Ver Avatar',
            description: 'Veja o avatar em tamanho grande',
            value: 'avatar',
            emoji: '🖼️'
          },
          {
            label: 'Ver Banner',
            description: 'Veja o banner do perfil (se tiver)',
            value: 'banner',
            emoji: '🎨'
          },
          {
            label: 'Ver Cargos',
            description: 'Veja todos os cargos do usuário',
            value: 'cargos',
            emoji: '🧩'
          }
        )
    );

    await interaction.editReply({ embeds: [baseEmbed], components: [selectRow] });

    const collector = interaction.channel.createMessageComponentCollector({
      componentType: 3,
      time: 60000
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id)
        return i.reply({ content: 'Apenas quem usou o comando pode interagir.', ephemeral: true });

      const selected = i.values[0];

      if (selected === 'avatar') {
        const avatarURL = user.displayAvatarURL({ dynamic: true, size: 1024 });
        const avatarEmbed = new EmbedBuilder()
          .setColor(cor.color || '#FFB6C1')
          .setTitle(`🖼️ Avatar de ${user.tag}`)
          .setImage(avatarURL);

        const buttonRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Baixar Avatar')
            .setStyle(ButtonStyle.Link)
            .setURL(avatarURL)
        );

        await i.update({ embeds: [avatarEmbed], components: [selectRow, buttonRow] });

      } else if (selected === 'banner') {
        const fetchedUser = await client.users.fetch(user.id, { force: true });

        if (!fetchedUser.banner) {
          return i.update({
            embeds: [new EmbedBuilder().setColor('Red').setDescription('Este usuário não possui banner.')],
            components: [selectRow]
          });
        }

        const bannerURL = fetchedUser.bannerURL({ dynamic: true, size: 1024 });
        const bannerEmbed = new EmbedBuilder()
          .setColor(cor.color || '#FFB6C1')
          .setTitle(`🎨 Banner de ${user.tag}`)
          .setImage(bannerURL);

        const buttonRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Baixar Banner')
            .setStyle(ButtonStyle.Link)
            .setURL(bannerURL)
        );

        await i.update({ embeds: [bannerEmbed], components: [selectRow, buttonRow] });

      } else if (selected === 'cargos') {
        const roles = member?.roles.cache
          .filter(r => r.id !== interaction.guild.id)
          .map(r => r.toString())
          .join(', ') || 'Nenhum cargo encontrado.';

        const cargosEmbed = new EmbedBuilder()
          .setColor(cor.color || '#FFB6C1')
          .setTitle(`🧩 Cargos de ${user.tag}`)
          .setDescription(roles);

        await i.update({ embeds: [cargosEmbed], components: [selectRow] });
      }
    });
  }
};