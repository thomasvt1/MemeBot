/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* All rights reserved.
*/

// This event executes when a new guild (server) is left.

module.exports = async (client, guild) => {
	client.logger.cmd(`[GUILD LEAVE] ${guild.name} (${guild.id}) removed the bot.`)

	client.user.setPresence({ game: { name: `MemeEconomy for ${client.guilds.size} servers ❤️`, type: "WATCHING" }, status: "online" })

	if (await client.settings.findOne({ _id: guild.id })) {
		await client.settings.remove(guild.id)
	}
}
