const Discord = require("discord.js")
const cor = require('../../config.js').discord.color
const User = require("../../Modules/Database/User")

module.exports = {
  name: 'transferir', // Coloque o nome do comando
  description: 'Transfira rubis para um usuário.', // Coloque a descrição do comando
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
        name: 'usuário',
        description: 'Mencione um usuário',
        type: Discord.ApplicationCommandOptionType.User,
        required: true,
    },
    {
        name: 'rubis',
        description: 'Quantidade de rubis.',
        type: Discord.ApplicationCommandOptionType.Number,
        required: true,
    }
  ],

  run: async (client, interaction) => {
    const userMentioned = interaction.options.getUser('usuário')

    const userId = interaction.user.id

    const coinsTransfer = Math.floor(interaction.options.getNumber('rubis'))

    const database = new User()

    try {
        const userDatabase = await database.find(userId)
        const userMentionedDatabase = await database.find(userMentioned.id)

        const embed = new Discord.EmbedBuilder()

        const validateTransfer = function(userDatabase, userMentionedDatabase, coinsTransfer) {
            if (!userDatabase) {
                return '- Você ainda não está cadastrado no banco de dados.\n- Por favor, utilize \`/cadastrar\`.'
            }

            if (!userMentionedDatabase) {
                return `- O usuário ${userMentioned} ainda não está cadastrado no banco de dados.\n- ${userMentioned.username} deve utilizar \`/cadastrar\`.`
            }

            if (userId === userMentioned.id) {
                return `- Você não pode transferir rubis para você mesmo.`
            }

            if (coinsTransfer <= 0) {
                return `- Você deve transferir apenas valores positivos.`
            }

            if (userDatabase.coins < coinsTransfer) {
                return `- Você não possui rubis o suficiente para realizar essa transferência.\n- Seu saldo: \`${userDatabase.coins}\` rubis.`
            }

            return null
        }

        const errorMessage = validateTransfer(userDatabase, userMentionedDatabase, coinsTransfer)

        if (errorMessage) {
            embed.setColor(cor).setTitle('Transferir').setDescription(errorMessage)

            return interaction.reply({ embeds: [embed] })
        }

        userDatabase.coins -= coinsTransfer
        await userDatabase.save()

        userMentionedDatabase.coins += coinsTransfer
        await userMentionedDatabase.save()

        embed.setColor(cor).setTitle('Transferir')
        .setDescription(`- Você transferiu \`${coinsTransfer}\` rubis para ${userMentioned}.\n- Use \`/balance\` para verificar seu saldo atual.`)

        interaction.reply({ embeds: [embed] })

    } catch (error) {
        console.error(error)
        database.sendErrorMessage(interaction, 'transferir')
    }
  }
}