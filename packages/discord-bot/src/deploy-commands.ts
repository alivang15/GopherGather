// FILE: packages/discord-bot/src/deploy-commands.ts

import { APIApplicationCommand, REST, RESTPostAPIApplicationCommandsJSONBody, Routes, SlashCommandBuilder } from 'discord.js'
import * as dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config();

// Define the expected shape of our command modules for type safety
interface CommandModule {
    data: SlashCommandBuilder;
    execute: (interaction: any) => Promise<void>; // 'any' is fine here as we don't execute it
}

// Explicitly type the 'commands' array to hold slash command JSON data
const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    // Cast the required module to our defined interface to ensure it has the right shape
    const command = require(filePath) as CommandModule;
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Ensure our environment variables are loaded
const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.DISCORD_CLIENT_ID!;
const guildId = process.env.DISCORD_GUILD_ID!; // The ID of your server

if (!token || !clientId || !guildId) {
    throw new Error("Missing required environment variables in .env file");
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        ) as APIApplicationCommand[];

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();

