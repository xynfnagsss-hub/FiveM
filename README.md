# Strap RP Discord Bot Setup Guide

This bot connects to your FiveM server to display real-time player counts in its status, plus has slash commands to check server status and list online players.

---

## 🛠️ Step-by-Step Installation

### Step 1: Create the Discord Application
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** at the top right and name it (e.g. `Strap RP Bot`).
3. Go to the **Bot** tab on the left.
4. Click **Reset Token**, copy the token, and save it somewhere secure. (This is your `DISCORD_TOKEN`).
5. Scroll down to the **Privileged Gateway Intents** section and enable:
   * **Presence Intent**
   * **Server Members Intent**
   * **Message Content Intent**
6. Click **Save Changes**.

---

### Step 2: Configure the Bot Settings
1. Open the `.env` file inside this `discord-bot` folder.
2. Paste your copied bot token next to `DISCORD_TOKEN=`.
3. In Discord, turn on **Developer Mode** (User Settings -> Advanced -> Developer Mode).
4. Right-click your Discord server name on the left and select **Copy Server ID**.
5. Paste it next to `DISCORD_GUILD_ID=` in your `.env` file.

---

### Step 3: Invite the Bot to Your Server
1. Go back to the Discord Developer Portal and select the **OAuth2** tab.
2. Select the **URL Generator** option.
3. Under **Scopes**, check:
   * `bot`
   * `applications.commands` (for Slash Commands)
4. Under **Bot Permissions**, check:
   * `Send Messages`
   * `Embed Links`
   * `Read Message History`
5. Copy the generated URL at the bottom and open it in your browser.
6. Select your server and click **Authorize**.

---

### Step 4: Install Dependencies & Run the Bot
1. Open **Command Prompt** or **PowerShell** on your PC.
2. Navigate to this folder:
   ```cmd
   cd "C:\Users\Old man\Downloads\Strap RP\discord-bot"
   ```
3. Install the required Node.js libraries:
   ```cmd
   npm install
   ```
4. Start the bot:
   ```cmd
   npm start
   ```

🟢 Once running, the bot status will show the server's current player count and players can use the `/status` and `/players` commands in Discord!
