/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* Last modified by Keanu73 <keanu@keanu73.net> on 2019-06-30
/* All rights reserved.
*/

// This event executes when a new guild (server) is left.

module.exports = (client, guild) => {
	client.logger.cmd(`[GUILD LEAVE] ${guild.name} (${guild.id}) removed the bot.`)

	client.user.setPresence({ game: { name: `MemeEconomy for ${client.guilds.size} servers ❤️`, type: "WATCHING" }, status: "online" })

	// If the settings Enmap contains any guild overrides, remove them.
	// No use keeping stale data!
	if (client.settings.has(guild.id)) {
		client.settings.delete(guild.id)
	}
}
