// FILE: packages/discord-bot/src/commands/submit-event.ts

import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, type ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('submit-event')
    .setDescription('Opens a form to submit a new campus event.');

// TODO: execution logic
export async function execute(interaction: ChatInputCommandInteraction) {

    // Create the modal (the pop-up window)
    const modal = new ModalBuilder()
        .setCustomId('eventSubmissionModal') // An ID to identify this modal later
        .setTitle('Submit a New Campus Event');

    // Create the text input components for our form
    const titleInput = new TextInputBuilder()
        .setCustomId('eventTitle')
        .setLabel("what is the event's title? ")
        .setStyle(TextInputStyle.Short) // A single-line input
        .setRequired(true);

    const dateInput = new TextInputBuilder()
        .setCustomId('eventDate')
        .setLabel("Date (YYYY-MM-DD)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const locationInput = new TextInputBuilder()
        .setCustomId('eventLocation')
        .setLabel("Location (CMU, Great Hall)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const rsvpUrlInput = new TextInputBuilder()
        .setCustomId('eventRsvpUrl')
        .setLabel("RSVP or More Info Link (Optional)")
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    // Modals require each input to be in its own ActionRow.
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput);
    const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(locationInput);
    const fourthActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(rsvpUrlInput);

    // Add inputs to the modal
    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

    // Show the modal to the user
    await interaction.showModal(modal);
}
