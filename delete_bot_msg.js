const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
    try {
        const channel = await client.channels.fetch('1525902936813863098');
        if (channel) {
            const messages = await channel.messages.fetch({ limit: 50 });
            const botMsg = messages.find(m => m.author.id === client.user.id);
            if (botMsg) {
                await botMsg.delete();
                console.log('Deleted bot message successfully!');
            } else {
                console.log('No bot message found.');
            }
        }
    } catch (error) {
        console.error('Error deleting bot message:', error);
    }
    client.destroy();
    process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
