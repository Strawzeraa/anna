const Discord = require('discord.js'); 
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'cobrinha',
  description: 'Jogue um mini game da cobrinha!',
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    const mapSize = 7;
    const delay = 1500; // 1.5 segundos
    let direction = null;
    let playing = false;

    const emojis = {
      head: '🐸',
      body: '🟩',
      food: '🍎',
      empty: '⬛',
    };

    let snake = [[3, 3]];
    let food = spawnFood();
    let interval;

    function spawnFood() {
      let pos;
      do {
        pos = [Math.floor(Math.random() * mapSize), Math.floor(Math.random() * mapSize)];
      } while (snake.some(p => p[0] === pos[0] && p[1] === pos[1]));
      return pos;
    }

    function renderMap() {
      const map = Array.from({ length: mapSize }, () => Array(mapSize).fill(emojis.empty));
      for (let i = 0; i < snake.length; i++) {
        const [x, y] = snake[i];
        map[y][x] = i === 0 ? emojis.head : emojis.body;
      }
      const [fx, fy] = food;
      map[fy][fx] = emojis.food;

      return map.map(row => row.join('')).join('\n');
    }

    function moveSnake() {
      if (!direction) return;

      const [headX, headY] = snake[0];
      let newX = headX;
      let newY = headY;

      if (direction === 'up') newY--;
      if (direction === 'down') newY++;
      if (direction === 'left') newX--;
      if (direction === 'right') newX++;

      // Colisão com parede
      if (newX < 0 || newX >= mapSize || newY < 0 || newY >= mapSize) return endGame();

      // Colisão com o próprio corpo
      if (snake.some(segment => segment[0] === newX && segment[1] === newY)) return endGame();

      snake.unshift([newX, newY]);

      if (newX === food[0] && newY === food[1]) {
        food = spawnFood();
      } else {
        snake.pop();
      }
    }

    function endGame() {
      clearInterval(interval);
      playing = false;
      interaction.editReply({
        content: '❌ **Fim de jogo!** Você bateu!',
        components: [],
      });
    }

    // Modificação dos botões para o layout desejado
    const buttons = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder().setCustomId('up').setLabel('🔼').setStyle(ButtonStyle.Primary),
    );

    const row2 = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder().setCustomId('left').setLabel('◀️').setStyle(ButtonStyle.Primary),
      new Discord.ButtonBuilder().setCustomId('down').setLabel('🔽').setStyle(ButtonStyle.Primary),
      new Discord.ButtonBuilder().setCustomId('right').setLabel('▶️').setStyle(ButtonStyle.Primary),
    );

    const gameMessage = await interaction.reply({
      content: `**Jogo da Cobrinha**\nClique em uma direção para começar!\n\n${renderMap()}`,
      components: [buttons, row2],
      fetchReply: true,
    });

    const collector = gameMessage.createMessageComponentCollector({
      time: 60_000,
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) return i.reply({ content: 'Esse jogo não é seu!', ephemeral: true });

      direction = i.customId;

      if (!playing) {
        playing = true;
        interval = setInterval(() => {
          moveSnake();
          if (playing) {
            gameMessage.edit({
              content: `**Jogo da Cobrinha**\n\n${renderMap()}`,
              components: [buttons, row2],
            });
          }
        }, delay);
      }

      i.deferUpdate();
    });

    collector.on('end', () => {
      if (playing) {
        clearInterval(interval);
        interaction.editReply({
          content: '⏱️ **Tempo esgotado!** Jogo encerrado.',
          components: [],
        });
      }
    });
  },
};