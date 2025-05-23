const Discord = require("discord.js");
const cor = require("../../config.js").discord.color;
const User = require("../../Modules/Schemas/User");

module.exports = {
  name: "ranking",
  description: "Veja o ranking dos usuários mais ricos.",
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    try {
      const topUsers = await User.find().sort({ coins: -1 });

      if (!topUsers || topUsers.length === 0) {
        return interaction.reply({
          embeds: [
            new Discord.EmbedBuilder()
              .setColor(cor)
              .setDescription("**Nenhum usuário foi encontrado no ranking ainda!**")
          ],
        });
      }

      const itemsPerPage = 5;
      let currentPage = 0;

      const getPage = async (page) => {
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const usersPage = topUsers.slice(start, end);

        const rankingLines = await Promise.all(usersPage.map(async (user, index) => {
          const globalIndex = start + index;
          const medalha = globalIndex === 0 ? '🥇' : globalIndex === 1 ? '🥈' : globalIndex === 2 ? '🥉' : '⭐';
          let username;

          try {
            const fetchedUser = await client.users.fetch(user.userId);
            username = fetchedUser.username;
          } catch {
            username = "Usuário desconhecido";
          }

          return `**${medalha} ${globalIndex + 1}.** ${username} — \`${user.coins.toLocaleString()}\``;
        }));

        const embed = new Discord.EmbedBuilder()
          .setColor(cor)
          .setTitle("**Ranking dos Mais Ricos**")
          .setDescription(rankingLines.join("\n"))
          .setThumbnail('https://cdn.discordapp.com/emojis/1369325451532697620.webp')
          .setFooter({ text: `Página ${page + 1} de ${Math.ceil(topUsers.length / itemsPerPage)}` })
          .setTimestamp();

        return embed;
      };

      const row = new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
          .setCustomId('prev')
          .setEmoji('<:left:1369321418365472919>')
          .setStyle(Discord.ButtonStyle.Primary)
          .setDisabled(currentPage === 0),
        new Discord.ButtonBuilder()
          .setCustomId('next')
          .setEmoji('<:rightarrow:1369321482274209812>')
          .setStyle(Discord.ButtonStyle.Primary)
          .setDisabled(currentPage >= Math.floor(topUsers.length / itemsPerPage))
      );

      const message = await interaction.reply({
        embeds: [await getPage(currentPage)],
        components: [row],
        fetchReply: true,
      });

      const collector = message.createMessageComponentCollector({
        componentType: Discord.ComponentType.Button,
        time: 60000,
      });

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: "Você não pode usar esses botões.", ephemeral: true });
        }

        if (i.customId === 'prev' && currentPage > 0) {
          currentPage--;
        } else if (i.customId === 'next' && currentPage < Math.floor(topUsers.length / itemsPerPage)) {
          currentPage++;
        }

        await i.update({
          embeds: [await getPage(currentPage)],
          components: [
            new Discord.ActionRowBuilder().addComponents(
              new Discord.ButtonBuilder()
                .setCustomId('prev')
                .setEmoji('<:left:1369321418365472919>')
                .setStyle(Discord.ButtonStyle.Primary)
                .setDisabled(currentPage === 0),
              new Discord.ButtonBuilder()
                .setCustomId('next')
                .setEmoji('<:rightarrow:1369321482274209812>')
                .setStyle(Discord.ButtonStyle.Primary)
                .setDisabled(currentPage >= Math.floor(topUsers.length / itemsPerPage))
            )
          ]
        });
      });

      collector.on('end', () => {
        message.edit({
          components: []
        }).catch(() => {});
      });

    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: 'Ocorreu um erro ao buscar o ranking.',
        ephemeral: true
      });
    }
  },
};