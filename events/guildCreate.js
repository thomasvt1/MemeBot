/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* All rights reserved.
*/

// This event executes when a new guild (server) is joined.

module.exports = async (client, guild) => {
	client.logger.cmd(`[GUILD JOIN] ${guild.name} (${guild.id}) added the bot. Owner: ${guild.owner.user.tag} (${guild.owner.user.id})`)

	await client.settings.create({
		_id: guild.id
	}).catch(err => client.logger.error(err.stack))

	client.users.get(guild.ownerID).send(":wave: Hello! I'm **MemeBot**, the MemeEconomy bot which gives you statistics and more. To configure your guild's settings, head over to your server and type in `&set`.\nOnce you've had a good look over what options you want to change, type in `&set edit <option> <value>`. \nIf you want to enable **Investment Watch** (https://i.imgur.com/cFAUn8B.png), you will need to run `&set edit investmentChannel <mention channel here>`. If you also want it to mention **everyone**, you can type `&set edit mentionEveryone true`. \nYou can also change the prefix by doing `&set edit prefix <insert symbol here>`. Also, if you would like your firm to have their logo displayed in all their glory (https://i.imgur.com/NilAlBI.png) like here, submit your firm logo to Keanu73 in the MemeBot Discord server. If you have **any** questions or would like to submit your firm logo, you can join the official MemeBot Discord server here: https://discord.gg/HpNxdcY")

	client.user.setPresence({ game: { name: `MemeEconomy for ${client.guilds.size} servers ❤️`, type: "WATCHING" }, status: "online" })
}
