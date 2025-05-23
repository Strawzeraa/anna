const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

module.exports = {
  name: 'jogodavelha',
  description: 'Desafie a Anna no jogo da velha!',
  type: 1,

  run: async (client, interaction) => {
    const empty = '⬜';
    const player = '❌';
    const bot = '⭕';
    let board = Array(9).fill(empty);

    const winCombos = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];

    const checkWin = (symbol) =>
      winCombos.some(combo => combo.every(i => board[i] === symbol));

    const getAvailable = () =>
      board.map((val, i) => val === empty ? i : null).filter(i => i !== null);

    const getButtons = () =>
      [0, 1, 2].map(row =>
        new ActionRowBuilder().addComponents(
          [0, 1, 2].map(col => {
            const i = row * 3 + col;
            return new ButtonBuilder()
              .setCustomId(i.toString())
              .setLabel(board[i])
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(board[i] !== empty);
          })
        )
      );

    const makeBotMove = () => {
      // 1. Tentar vencer
      for (const combo of winCombos) {
        const [a, b, c] = combo;
        const values = [board[a], board[b], board[c]];
        if (values.filter(v => v === bot).length === 2 && values.includes(empty)) {
          return combo[values.indexOf(empty)];
        }
      }
      // 2. Bloquear o jogador
      for (const combo of winCombos) {
        const [a, b, c] = combo;
        const values = [board[a], board[b], board[c]];
        if (values.filter(v => v === player).length === 2 && values.includes(empty)) {
          return combo[values.indexOf(empty)];
        }
      }
      // 3. Canto central se livre
      if (board[4] === empty) return 4;
      // 4. Movimento aleatório
      const available = getAvailable();
      return available[Math.floor(Math.random() * available.length)];
    };

    const embed = new EmbedBuilder()
      .setTitle('❣️ Jogo da Velha — Você vs Anna')
      .setDescription('É sua vez! Clique em um dos quadrados abaixo para jogar.')
      .setColor('#FFB6C1');

    await interaction.reply({
      embeds: [embed],
      components: getButtons()
    });

    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 60000
    });

    collector.on('collect', async i => {
      const idx = parseInt(i.customId);
      if (board[idx] !== empty) return;

      board[idx] = player;

      if (checkWin(player)) {
        collector.stop();
        return i.update({
          embeds: [embed.setDescription('Você ganhou! Que jogada incrível!')],
          components: disableAll()
        });
      }

      if (!getAvailable().length) {
        collector.stop();
        return i.update({
          embeds: [embed.setDescription('Empatamos! Foi uma partida equilibrada!')],
          components: disableAll()
        });
      }

      // Vez da Anna
      const botMove = makeBotMove();
      board[botMove] = bot;

      if (checkWin(bot)) {
        collector.stop();
        return i.update({
          embeds: [embed.setDescription('Haha, eu venci! Vamos jogar de novo?')],
          components: disableAll()
        });
      }

      if (!getAvailable().length) {
        collector.stop();
        return i.update({
          embeds: [embed.setDescription('Empatamos! Foi divertido!')],
          components: disableAll()
        });
      }

      await i.update({
        embeds: [embed],
        components: getButtons()
      });
    });

    const disableAll = () =>
      getButtons().map(row => {
        row.components.forEach(b => b.setDisabled(true));
        return row;
      });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        msg.edit({
          embeds: [embed.setDescription('Tempo esgotado! Você ficou pensativa demais...')],
          components: disableAll()
        });
      }
    });
  }
};