// FILE: packages/discord-bot/src/index.ts

import { Client, GatewayIntentBits, Collection, Events, Interaction, MessageFlags, Message } from 'discord.js';
import * as dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// Load environment variables from our .env file
dotenv.config();

// Define a new type for our client that includes a 'commands' property
class BotClient extends Client {
    commands: Collection<string, any> = new Collection();
}

const client = new BotClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
    ],
});

// -- Command Handler --
// This code finds all our command files and loads them into the client.commands collection.
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// --- Event Listeners ---
client.once(Events.ClientReady, readyClient => {
    console.log(`✅ Logged in as ${readyClient.user.tag}!`);
});

// This listener executes when a user uses a slash command.
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    console.log('[DEBUG] Interaction received!'); // <<< DEBUG
    if (interaction.isChatInputCommand()) {
        const command = (interaction.client as any).commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ 
                    content: 'There was an error while executing this command!', 
                    flags: [MessageFlags.Ephemeral] 
                });
            } else {
                await interaction.reply({ 
                    content: 'There was an error while executing this command!', 
                    flags: [MessageFlags.Ephemeral]
                });
            }
        }
    } else if (interaction.isModalSubmit()) {
        // Handle the modal submission
        if (interaction.customId === 'eventSubmissionModal') {
            const title = interaction.fields.getTextInputValue('eventTitle');
            const date = interaction.fields.getTextInputValue('eventDate');
            const location = interaction.fields.getTextInputValue('eventLocation');
            const rsvpUrl = interaction.fields.getTextInputValue('eventRsvpUrl');

            // TODO: Add logic to save this data to a database or file

            console.log('Event Submitted:', { title, date, location, rsvpUrl });

            await interaction.reply({ 
                content: 'Your event has been submitted successfully!', 
                flags: [MessageFlags.Ephemeral]
            });
        }
    } else {
        // This will now correctly be ignored if it's not a command or our modal
        console.log('[DEBUG] Interaction was not a command or known modal. Ignoring.');
        return;
    }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error('DISCORD_TOKEN is not defined in the .env file.');
}

client.login(token);
console.log('Bot is starting...');
