const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    try {
        const channel = await client.channels.fetch('1525902936813863098');
        if (channel) {
            const rulesData = JSON.parse(fs.readFileSync('rules.json', 'utf8'));
            const embedData = rulesData.embeds[0];
            
            const embed = new EmbedBuilder()
                .setTitle(embedData.title)
                .setDescription(embedData.description)
                .setColor(embedData.color)
                .setFields(embedData.fields)
                .setFooter({ text: embedData.footer.text });
                
            await channel.send({ embeds: [embed] });
            console.log('Rules posted successfully to rules channel!');
        } else {
            console.error('Channel not found!');
        }
    } catch (error) {
        console.error('Error posting rules:', error);
    }
    client.destroy();
    process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
