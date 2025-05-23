require('dotenv').config();

const config = { // Dados derivados do arquivo .env
    discord: {
        token: process.env.DISCORD_BOT_TOKEN,  // Token do bot
        color: 'Purple',  // Cor padrão
        verifiedServers: [
            '1300533896034914365',  // ID do servidor 1
            '946018750883328000'   // ID do servidor 2
            // Adicione os IDs dos servidores verificados aqui
        ],
        clientId: process.env.DISCORD_BOT_ID // ID do Bot
    },
    mongo_db: {
        uri: process.env.MONGODB_URI  // URI do MongoDB
    }
};

module.exports = config;