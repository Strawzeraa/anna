const Discord = require("discord.js");
const cor = require('../../config.js').discord.color;
const config = require('../../config.js');
const User = require("../../Modules/Database/User");

module.exports = {
  name: 'investir',
  description: 'Invista seus rubis com diferentes níveis de risco.',
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'quantia',
      description: 'Quantia de rubis para investir.',
      type: Discord.ApplicationCommandOptionType.Integer,
      required: true
    },
    {
      name: 'risco',
      description: 'Escolha o nível de risco.',
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: 'Baixo (seguro)', value: 'baixo' },
        { name: 'Médio (equilibrado)', value: 'medio' },
        { name: 'Alto (arriscado)', value: 'alto' }
      ]
    }
  ],

  run: async (client, interaction) => {
    const userId = interaction.user.id;
    const valor = interaction.options.getInteger('quantia');
    const risco = interaction.options.getString('risco');
    const database = new User();

    try {
      const userData = await database.find(userId);

      if (!userData) return database.sendUndefinedUserMessage(interaction, interaction.user);
      if (!valor || valor <= 0 || isNaN(valor)) {
        return interaction.reply({
          embeds: [new Discord.EmbedBuilder()
            .setColor('Red')
            .setTitle('Investimento inválido')
            .setDescription('- Você deve investir uma quantia positiva de rubis!')]
        });
      }

      if (userData.coins < valor) {
        return interaction.reply({
          embeds: [new Discord.EmbedBuilder()
            .setColor('Red')
            .setTitle('Saldo insuficiente')
            .setDescription(`- Você não possui rubis suficientes.\n- Saldo atual: \`${userData.coins}\``)]
        });
      }

      const cooldown = 1000 * 60 * 60 * 24; // 24h
      const now = Date.now();
      const lastInvest = userData.lastInvest || 0;

      if (now - lastInvest < cooldown) {
        return interaction.reply({
          embeds: [new Discord.EmbedBuilder()
            .setColor('Yellow')
            .setTitle('Espere um pouco...')
            .setDescription(`- Você já investiu hoje.\n- Tente novamente <t:${Math.floor((lastInvest + cooldown) / 1000)}:R>.`)]
        });
      }

      const chance = Math.random();
      const serverVerified = config.discord.verifiedServers.includes(interaction.guild.id);

      // Lógica de risco
      const riscos = {
        baixo: { chance: 0.75, multi: serverVerified ? 1.4 : 1.3 },
        medio: { chance: 0.5, multi: serverVerified ? 1.7 : 1.5 },
        alto: { chance: 0.3, multi: serverVerified ? 2.2 : 2.0 }
      };

      const { chance: probabilidade, multi: multiplicador } = riscos[risco];
      const sucesso = chance < probabilidade;
      const ganho = sucesso ? Math.floor(valor * multiplicador) : 0;
      const resultado = sucesso ? ganho : -valor;
      const novoSaldo = userData.coins + resultado;

      userData.coins = novoSaldo;
      userData.lastInvest = now;
      await userData.save();

      const progresso = criarBarraProgresso(sucesso ? multiplicador : 0, 2.5);

      const embed = new Discord.EmbedBuilder()
        .setColor(sucesso ? 'Green' : 'Red')
        .setTitle(`Investimento (${risco.charAt(0).toUpperCase() + risco.slice(1)})`)
        .setDescription(
          `${serverVerified ? "- Servidor verificado! ✅" : "- Servidor não verificado! ❌"}\n\n` +
          (sucesso
            ? `- Você investiu \`${valor}\` e **ganhou \`${ganho}\` rubis!** 🎉\n- Multiplicador: \`x${multiplicador.toFixed(2)}\`\n${progresso}\n\n- Saldo atual: \`${novoSaldo}\` 💎`
            : `- Você investiu \`${valor}\` e **perdeu tudo...** 😞\n${progresso}\n\n- Saldo atual: \`${novoSaldo}\` 💎`
          )
        );

      interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      database.sendErrorMessage(interaction, 'investir');
    }
  }
};

function criarBarraProgresso(valor, maximo, tamanho = 10) {
  const proporcao = Math.min(valor / maximo, 1);
  const blocos = Math.round(proporcao * tamanho);
  return `\`[${'█'.repeat(blocos)}${'░'.repeat(tamanho - blocos)}] ${Math.round(proporcao * 100)}%\``;
}