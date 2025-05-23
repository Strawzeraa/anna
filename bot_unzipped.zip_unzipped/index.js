const { Client, GatewayIntentBits, Partials, InteractionType, EmbedBuilder } = require('discord.js');
const config = require('./config');
const Database = require('./Modules/Database/Database');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildInvites
    ],
    partials: [
        Partials.User,
        Partials.Message,
        Partials.Reaction,
        Partials.Channel,
        Partials.GuildMember
    ]
});

require('./Handler/commands')(client);
require('./Handler/events')(client);

client.on('interactionCreate', async interaction => {
    if (interaction.type !== InteractionType.ApplicationCommand) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) {
        return interaction.reply({ ephemeral: true, content: 'Algo deu errado ao localizar este comando.' });
    }

    try {
        await command.run(client, interaction);
    } catch (err) {
        console.error(`Erro ao executar o comando ${command.name}:`, err);
        interaction.reply({ ephemeral: true, content: 'Houve um erro ao executar este comando.' });
    }
});

// Resposta quando Anna for mencionada
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Verifica se a mensagem menciona diretamente o bot
    if (message.mentions.has(client.user)) {
        // Responde apenas se o bot foi mencionado sozinho
        if (message.content.trim() === `<@${client.user.id}>` || message.content.trim() === `<@!${client.user.id}>`) {
            const embed = new EmbedBuilder()
                .setColor('#f48fb1')
                .setTitle('Olá, eu sou a Anna! 🌸')
                .setDescription(`✨ Que bom te ver por aqui! Para começar a usar meus comandos, digite **/cadastrar**.\n
Depois, use **/help** para descobrir tudo que posso fazer por você! 💫\n
Economize rubis, personalize sua aparência com banners e divirta-se! 🎀\n
Se tiver dúvidas, estarei sempre por perto! 💌`)
                .setFooter({ text: 'Com carinho, Anna 💖' })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }
    }
});

client.login(config.discord.token)
    .catch(err => {
        console.error('Erro ao tentar fazer login no Discord:', err);
    });

// Conexão com MongoDB
const db = new Database(config.mongo_db.uri);
db.connect()
    .then(() => {
        console.log('Conectado ao MongoDB com sucesso!');
    })
    .catch(err => {
        console.error('Erro ao conectar ao MongoDB:', err);
    });

// Tratar erros não tratados
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err, origin) => {
    console.error('Uncaught Exception thrown:', err, 'Exception origin:', origin);
});
process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error('Uncaught Exception Monitor:', err, 'Origin:', origin);
});

module.exports = client;