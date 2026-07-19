// bot.js - Discord Bot bridge for Strap RP FiveM server
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const http = require('http');

const BANS_FILE_PATH = 'C:\\Users\\Old man\\Downloads\\Strap RP\\txData\\FiveMBasicServerCFXDefault_5BA7C3.base\\resources\\[local]\\discord_bans\\bans.json';

// Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const FIVEM_SERVER_URL = process.env.FIVEM_SERVER_URL || 'http://localhost:30120';
const UPDATE_INTERVAL = 15000; // Poll every 15 seconds

client.once('ready', () => {
    console.log(`[Discord Bot] Logged in as ${client.user.tag}!`);
    
    // Start status updating loop
    updateStatus();
    setInterval(updateStatus, UPDATE_INTERVAL);
});

// Update Discord Bot status with real-time player count
async function updateStatus() {
    try {
        const response = await fetch(`${FIVEM_SERVER_URL}/players.json`, { timeout: 3000 });
        if (response.ok) {
            const players = await response.json();
            const playerCount = players.length;
            
            client.user.setActivity(`Strap RP: ${playerCount}/48 players`, {
                type: ActivityType.Playing
            });
        } else {
            setOfflineStatus();
        }
    } catch (error) {
        setOfflineStatus();
    }
}

function setOfflineStatus() {
    client.user.setActivity('Server is Offline 🔴', {
        type: ActivityType.Watching
    });
}

// Handle Slash Commands
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    const { commandName } = interaction;
    
    if (commandName === 'status') {
        await interaction.deferReply();
        try {
            const response = await fetch(`${FIVEM_SERVER_URL}/info.json`, { timeout: 3000 });
            if (response.ok) {
                const info = await response.json();
                const playersResponse = await fetch(`${FIVEM_SERVER_URL}/players.json`);
                const players = await playersResponse.json();
                
                const embed = new EmbedBuilder()
                    .setTitle('Strap RP Server Status')
                    .setColor(0x00FF00) // Green
                    .addFields(
                        { name: 'Status', value: '🟢 Online', inline: true },
                        { name: 'Players', value: `${players.length}/48`, inline: true },
                        { name: 'Game Build', value: info.vars.sv_enforceGameBuild || 'Default', inline: true },
                        { name: 'Artifacts Version', value: info.server || 'Unknown', inline: false }
                    )
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [embed] });
            } else {
                throw new Error('Server returned error status');
            }
        } catch (error) {
            const embed = new EmbedBuilder()
                .setTitle('Strap RP Server Status')
                .setColor(0xFF0000) // Red
                .setDescription('🔴 The server is currently offline or unreachable.')
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
    }
    
    else if (commandName === 'players') {
        await interaction.deferReply();
        try {
            const response = await fetch(`${FIVEM_SERVER_URL}/players.json`, { timeout: 3000 });
            if (response.ok) {
                const players = await response.json();
                
                const embed = new EmbedBuilder()
                    .setTitle(`Online Players (${players.length})`)
                    .setColor(0x3498DB) // Blue
                    .setTimestamp();
                
                if (players.length === 0) {
                    embed.setDescription('No players currently online.');
                } else {
                    let playerList = '';
                    players.forEach(player => {
                        playerList += `• **[ID: ${player.id}]** ${player.name} | Ping: ${player.ping}ms\n`;
                    });
                    embed.setDescription(playerList);
                }
                
                await interaction.editReply({ embeds: [embed] });
            } else {
                throw new Error('Server returned error status');
            }
        } catch (error) {
            await interaction.editReply('🔴 Error fetching player list from FiveM server.');
        }
    }
    
    else if (commandName === 'ban') {
        // Verify administrator or ban permissions in Discord
        if (!interaction.member.permissions.has('Administrator') && !interaction.member.permissions.has('BanMembers')) {
            return interaction.reply({ content: '🔴 You do not have permission to use this command!', ephemeral: true });
        }
        
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Banned via slash command.';
        
        await interaction.deferReply();
        
        try {
            // Ban user from Discord guild
            await interaction.guild.members.ban(user, { reason: reason });
            // Add ban to FiveM bans.json
            addBan(user.id, reason, interaction.user.tag);
            
            await interaction.editReply(`🟢 Successfully banned **${user.tag}** from both Discord and the FiveM server!\n**Reason:** ${reason}`);
        } catch (error) {
            console.error('[Discord Bot] Error banning user:', error);
            await interaction.editReply(`🔴 Failed to ban user from Discord. (Make sure my bot role is higher than their role!)`);
        }
    }
});

// Guild Ban Event Listeners
client.on('guildBanAdd', (ban) => {
    console.log(`[Discord Bot] User ${ban.user.tag} (${ban.user.id}) was banned from Discord.`);
    addBan(ban.user.id, ban.reason || 'Banned from Discord server.', 'Discord Audit Log');
});

client.on('guildBanRemove', (ban) => {
    console.log(`[Discord Bot] User ${ban.user.tag} (${ban.user.id}) was unbanned from Discord.`);
    removeBan(ban.user.id);
});

// Helper functions for writing to bans.json
function addBan(discordId, reason, bannedBy) {
    try {
        let banList = [];
        if (fs.existsSync(BANS_FILE_PATH)) {
            const data = fs.readFileSync(BANS_FILE_PATH, 'utf8');
            banList = JSON.parse(data || '[]');
        }
        
        // Check if already banned
        if (banList.some(ban => ban.discordId === discordId)) {
            return;
        }
        
        banList.push({
            discordId: discordId,
            reason: reason || 'Banned via Discord.',
            bannedBy: bannedBy || 'System',
            timestamp: new Date().toISOString()
        });
        
        fs.writeFileSync(BANS_FILE_PATH, JSON.stringify(banList, null, 2), 'utf8');
        console.log(`[Discord Bot] Banned user ${discordId} on FiveM.`);
    } catch (error) {
        console.error('[Discord Bot] Error writing to FiveM bans.json:', error);
    }
}

function removeBan(discordId) {
    try {
        if (fs.existsSync(BANS_FILE_PATH)) {
            const data = fs.readFileSync(BANS_FILE_PATH, 'utf8');
            let banList = JSON.parse(data || '[]');
            banList = banList.filter(ban => ban.discordId !== discordId);
            fs.writeFileSync(BANS_FILE_PATH, JSON.stringify(banList, null, 2), 'utf8');
            console.log(`[Discord Bot] Unbanned user ${discordId} on FiveM.`);
        }
    } catch (error) {
        console.error('[Discord Bot] Error removing from FiveM bans.json:', error);
    }
}

// Register Slash Commands on boot if guild is set
client.on('guildCreate', async (guild) => {
    registerCommands(guild.client, guild.id);
});

async function registerCommands(clientInstance, guildId) {
    const commands = [
        {
            name: 'status',
            description: 'Check the status of the Strap RP server'
        },
        {
            name: 'players',
            description: 'List all online players on the server'
        },
        {
            name: 'ban',
            description: 'Ban a user from both Discord and FiveM',
            options: [
                {
                    name: 'user',
                    type: 6, // USER type
                    description: 'The user to ban',
                    required: true
                },
                {
                    name: 'reason',
                    type: 3, // STRING type
                    description: 'Reason for the ban',
                    required: false
                }
            ]
        }
    ];
    
    try {
        if (guildId && guildId.trim() !== "") {
            await clientInstance.application.commands.set(commands, guildId);
            console.log(`[Discord Bot] Slash commands registered successfully for Guild ${guildId}`);
        } else {
            await clientInstance.application.commands.set(commands);
            console.log(`[Discord Bot] Slash commands registered globally!`);
        }
    } catch (error) {
        console.error('[Discord Bot] Error registering slash commands:', error);
    }
}

// Automatically register commands on ready
client.on('ready', () => {
    registerCommands(client, process.env.DISCORD_GUILD_ID);
});

client.login(process.env.DISCORD_TOKEN);

// HTTP log listener server
const LOG_CHANNEL_ID = '1525902939313668225';
const HTTP_PORT = 30125;

const logServer = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/log') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const payload = JSON.parse(body);
                const channel = await client.channels.fetch(LOG_CHANNEL_ID);
                if (channel) {
                    const embed = new EmbedBuilder()
                        .setTitle(payload.title || 'In-Game Log')
                        .setDescription(payload.message)
                        .setColor(payload.color || 0xFFFFFF)
                        .setTimestamp();
                    
                    await channel.send({ embeds: [embed] });
                }
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('OK');
            } catch (error) {
                console.error('[Discord Bot] Error sending log to Discord:', error);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error');
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

logServer.listen(HTTP_PORT, '127.0.0.1', () => {
    console.log(`[Discord Bot] Local log listener running on port ${HTTP_PORT}`);
});
