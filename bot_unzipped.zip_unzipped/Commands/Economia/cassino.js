const Discord = require('discord.js');
const User = require('../../Modules/Database/User');
const ms = require('ms');

module.exports = {
  name: 'cassino',
  description: 'Jogue no caça-níquel com seus rubis!',
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'valor',
      description: 'Quantia de rubis (mínimo 1000) ou "all" para apostar tudo.',
      type: Discord.ApplicationCommandOptionType.String,
      required: true
    }
  ],

  run: async (client, interaction) => {
    const input = interaction.options.getString('valor');
    const userId = interaction.user.id;
    const database = new User();
    const emojis = ['🍒', '💎', '7️⃣', '⭐', '🍋'];
    const cooldown = 3 * 60 * 60 * 1000; // 3 horas

    try {
      const userData = await database.find(userId);
      if (!userData) {
        return interaction.reply({ content: '❌ Você ainda não tem uma conta registrada.', ephemeral: true });
      }

      let valor = 0;
      if (input.toLowerCase() === 'all') {
        valor = userData.coins;
      } else {
        valor = parseInt(input);
        if (isNaN(valor)) {
          return interaction.reply({ content: '❌ Valor inválido. Digite um número ou "all".', ephemeral: true });
        }
      }

      if (valor < 1000) {
        return interaction.reply({ content: '❌ A aposta mínima é de **1.000** rubis.' });
      }

      if (userData.coins < valor) {
        return interaction.reply({ content: '❌ Você não tem rubis suficientes para essa aposta.' });
      }

      const lastUse = userData.lastCasino || 0;
      if (Date.now() - lastUse < cooldown) {
        const restante = ms(cooldown - (Date.now() - lastUse), { long: true });
        const formattedRestante = restante.replace('hour', 'hora').replace('hours', 'horas');

        return interaction.reply({ content: `⏳ Você já jogou recentemente. Tente novamente em **${formattedRestante}**.`, ephemeral: true });
      }

      await interaction.reply({ content: '<:slot:1370863647471042661> Iniciando as roletas mágicas...' });

      // Animações decoradas aleatórias
      const animacoes = [
        { slots: ['🍒', '💎', '7️⃣'], previsao: '`Será que vem rubis?`' },
        { slots: ['⭐', '🍋', '🍒'], previsao: '`Girando... boa sorte!`' },
        { slots: ['💎', '💎', '💎'], previsao: '`Jackpot se aproximando?`' },
        { slots: ['🍋', '⭐', '🍒'], previsao: '`Nada dessa vez...?`' },
        { slots: ['7️⃣', '7️⃣', '🍒'], previsao: '`Essa combinação parece promissora...`' }
      ];

      for (let i = 0; i < 3; i++) {
        const passo = animacoes[Math.floor(Math.random() * animacoes.length)];
        await new Promise(r => setTimeout(r, 800));
        await interaction.editReply({ content: `${passo.previsao}\n<:slot:1370863647471042661> | [${passo.slots.join('][')}]` });
      }

      const resultadoSlots = [
        emojis[Math.floor(Math.random() * emojis.length)],
        emojis[Math.floor(Math.random() * emojis.length)],
        emojis[Math.floor(Math.random() * emojis.length)]
      ];

      let ganho = 0;
      let multiplicador = 0;

      if (resultadoSlots[0] === resultadoSlots[1] && resultadoSlots[1] === resultadoSlots[2]) {
        multiplicador = 2;
        ganho = valor * multiplicador;
      } else if (
        resultadoSlots[0] === resultadoSlots[1] ||
        resultadoSlots[1] === resultadoSlots[2] ||
        resultadoSlots[0] === resultadoSlots[2]
      ) {
        multiplicador = 1.5;
        ganho = Math.floor(valor * multiplicador);
      }

      const lucro = ganho - valor;

      userData.coins = userData.coins - valor + ganho;
      userData.lastCasino = Date.now();
      await userData.save();

      const embed = new Discord.EmbedBuilder()
        .setColor(ganho > valor ? 'Green' : (ganho === valor ? 'Yellow' : 'Red'))
        .setTitle('<:slot:1370863647471042661> Resultado Final - Cassino Rubi')
        .setDescription(
          `**Slots:** [${resultadoSlots.join('][')}]\n\n` +
          (ganho > valor
            ? `✨ Você apostou \`${valor}\` e **ganhou \`${lucro}\`** <:rubi:1369325451532697620>!\nMultiplicador: \`x${multiplicador.toFixed(1)}\`` +
              `\n\n<:rubi:1369325451532697620> **Total recebido:** \`${ganho}\` rubis`
            : ganho === valor
              ? `Você apostou \`${valor}\` e **empatou**. Seu saldo não mudou.`
              : `💥 Você perdeu sua aposta de \`${valor}\` <:rubi:1369325451532697620>.`) +
          `\n\n<:rubi:1369325451532697620> **Saldo atual:** \`${userData.coins}\` rubis`
        )
        .setFooter({ text: 'Cooldown de 3 horas para jogar novamente.' });

      await new Promise(r => setTimeout(r, 1000));
      return interaction.editReply({ content: '', embeds: [embed] });

    } catch (e) {
      console.error(e);
      return interaction.editReply({ content: '❌ Ocorreu um erro ao processar o cassino.' });
    }
  }
};