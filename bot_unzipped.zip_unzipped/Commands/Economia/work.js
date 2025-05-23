const Discord = require("discord.js")
const cor = require('../../config.js').discord.color
const User = require("../../Modules/Database/User")

module.exports = {
  name: 'work',
  description: 'Veja qual trabalho você tem hoje e ganhe rubis!',
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    const userId = interaction.user.id
    const database = new User()

    const jobs = [
      { name: '👨‍🍳 Cozinheiro', description: 'Você é um **Cozinheiro**! Preparando deliciosos pratos e atendendo aos pedidos dos clientes no restaurante.' },
      { name: '🍽️ Garçom', description: 'Você é um **Garçom**! Servindo mesas, levando pratos e interagindo com os clientes.' },
      { name: '💻 Programador', description: 'Você é um **Programador**! Codificando sistemas complexos e criando soluções incríveis.' },
      { name: '🔧 Mecânico', description: 'Você é um **Mecânico**! Consertando carros e garantindo que funcionem perfeitamente.' },
      { name: '🎨 Artista', description: 'Você é um **Artista**! Criando obras-primas e deixando o mundo mais bonito.' },
      { name: '💼 Advogado', description: 'Você é um **Advogado**! Defendendo clientes e resolvendo disputas legais.' },
      { name: '🏋️‍♂️ Personal Trainer', description: 'Você é um **Personal Trainer**! Motivando pessoas a alcançarem seus objetivos.' },
      { name: '👩‍🍳 Chef de Cozinha', description: 'Você é um **Chef de Cozinha**! Coordenando receitas incríveis e liderando a equipe.' },
      { name: '🚀 Astronauta', description: 'Você é um **Astronauta**! Explorando o espaço e realizando missões.' },
      { name: '🧑‍⚖️ Juiz', description: 'Você é um **Juiz**! Avaliando casos e tomando decisões no tribunal.' },
      { name: '🎤 Cantor', description: 'Você é um **Cantor**! Espalhando alegria com sua voz.' },
      { name: '📚 Professor', description: 'Você é um **Professor**! Ensinando e inspirando seus alunos.' },
      { name: '🏨 Gerente de Hotel', description: 'Você é um **Gerente de Hotel**! Garantindo a melhor estadia possível para seus clientes.' }
    ]

    try {
      const userDatabase = await database.find(userId)
      if (!userDatabase) {
        database.sendUndefinedUserMessage(interaction)
        return
      }

      const lastWork = userDatabase.lastWork || 0
      const now = Date.now()
      const cooldownTime = 3600000 // 1 hora

      if (now - lastWork < cooldownTime) {
        const timeLeft = cooldownTime - (now - lastWork)
        const timeFormatted = new Date(timeLeft).toISOString().substr(11, 8)

        return interaction.reply({ 
          embeds: [
            new Discord.EmbedBuilder()
              .setColor(cor)
              .setTitle('⏳ Cooldown de Trabalho')
              .setDescription(`Você precisa esperar mais **${timeFormatted}** para trabalhar novamente!`)
              .setFooter({ text: 'Volte em breve para aumentar sua fortuna!' })
          ],
          ephemeral: true 
        })
      }

      const randomJob = jobs[Math.floor(Math.random() * jobs.length)]
      const minReward = 400
      const maxReward = 1500
      const workReward = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward

      userDatabase.coins += workReward
      userDatabase.lastWork = now
      await userDatabase.save()

      const embed = new Discord.EmbedBuilder()
        .setColor(cor)
        .setTitle('**💼 Seu Trabalho de Hoje**')
        .setDescription(`> ${randomJob.name}\n> ${randomJob.description}`)
        .addFields(
          {
            name: '━━━━━━━━━━━━━━━━━━',
            value: '**Resultado do dia:**',
          },
          {
            name: 'Rubis Recebidos',
            value: `\`+${workReward} rubis\` <:rubi:1369325451532697620>`,
            inline: true,
          },
          {
            name: 'Saldo Atual',
            value: `\`${userDatabase.coins} rubis\``,
            inline: true,
          },
          {
            name: '━━━━━━━━━━━━━━━━━━',
            value: `**Próximo trabalho disponível às**: \`${new Date(now + cooldownTime).toLocaleTimeString()}\``,
          }
        )
        .setFooter({ text: 'Trabalhar nunca foi tão recompensador!' })
        .setTimestamp()

      interaction.reply({ embeds: [embed] })

    } catch (error) {
      console.error(error)
      database.sendErrorMessage(interaction, 'work')
    }
  }
}