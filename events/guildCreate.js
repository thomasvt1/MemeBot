// This event executes when a new guild (server) is joined.

module.exports = async (client, guild) => {
	client.logger.cmd(`[GUILD JOIN] ${guild.name} (${guild.id}) added the bot. Owner: ${guild.owner.user.tag} (${guild.owner.user.id})`)

	client.settings.set(guild.id, client.config.defaultSettings)

	let investmentChannel

	const owner = client.users.get(guild.ownerID)
	const ownerChannel = owner.dmChannel

	await owner.send(":wave: Hello! I'm **MemeBot**, the MemeEconomy *bot* which gives you statistics and guides you on investments.")
	const response = await getReply(ownerChannel, (m => m.content.toLowerCase() === "yes" || m.content.toLowerCase() === "no"), "First off, would you like **Investment Watch** in your server? (you have 60 seconds to answer) [*yes*/*no*] (e.g. https://i.imgur.com/cFAUn8B.png)")

	if (!response) await owner.send(":exclamation: Something went wrong. For now, use `$set` and `$set edit investmentChannel <channel mention or channel id>` and so on to configure settings.")

	if (response && response.toLowerCase() === "yes") {
		const investmentChannel = await getReply(ownerChannel, (m => client.channels.get(m.content)), "What's the channel ID of the investment watch channel you want? (Enable Developer Mode in Settings -> Appearance -> Developer Mode and right-click on the channel then 'Copy ID')")
		if (!investmentChannel) await owner.send(":exclamation: Something went wrong. For now, use `$set` and `$set edit investmentChannel <channel mention or channel id>` and so on to configure settings.")
		client.settings.set(guild.id, "investmentChannel", investmentChannel)

		const mentionEveryone = await getReply(ownerChannel, (m => m.content.toLowerCase() === "yes" || m.content.toLowerCase() === "no"), "Finally, should **Investment Watch** mention everyone in the server? [*yes*/*no*]")
		if (!mentionEveryone) await owner.send(":exclamation: Something went wrong. For now, use `$set` and `$set edit mentionEveryone <true/false>` and so on to configure settings.")
		client.settings.set(guild.id, "mentionEveryone", mentionEveryone === "yes" ? "true" : "false")

		const prefix = await getReply(ownerChannel, (m => m.content.toLowerCase() === "yes" || m.content.toLowerCase() === "no"), `OK. Would you like to change the prefix from \`${client.config.defaultSettings.prefix}\` to something else? [*yes*/*no*]`)
		if (!prefix) await owner.send(":exclamation: Something went wrong. For now, use `$set` and `$set edit prefix <new prefix>` and so on to configure settings.")

		if (prefix.toLowerCase() === "yes") {
			const res = await getReply(ownerChannel, (m => m.match(/^[a-zA-Z][0-9][-!$%^&*()_+|~=`{}[\]:";'<>?,./]$/)), "What new prefix would you like? (enter symbol, letters, etc)")
			if (!res) await owner.send(":exclamation: Something went wrong. For now, use `$set` and `$set edit prefix <new prefix>` and so on to configure settings.")
			client.settings.set(guild.id, "prefix", res)
			await owner.send(`Alright! That's us done with ${guild.name} then, ${owner.name}. You can now properly use MemeBot in your server. If you want to disable Investment Watch anytime, just run \`${client.settings.get(guild.id, "prefix")}set edit investmentChannel 0\`. Have fun!`)
		}

		if (prefix.toLowerCase() === "no") {
			await owner.send(`Alright! That's us done with ${guild.name} then, ${owner.name}. You can now properly use MemeBot in your server. If you want to disable Investment Watch anytime, just run \`${client.settings.get(guild.id, "prefix")}set edit investmentChannel 0\`. Have fun!`)
		}
	}

	if (response && response.toLowerCase() === "no") {
		const prefix = await getReply(ownerChannel, (m => m.content.toLowerCase() === "yes" || m.content.toLowerCase() === "no"), `OK. Would you like to change the prefix from \`${client.config.defaultSettings.prefix}\` to something else? [*yes*/*no*]`)
		if (!prefix) await owner.send(":exclamation: Something went wrong. For now, use `$set` and `$set edit prefix <new prefix>` and so on to configure settings.")

		if (prefix.toLowerCase() === "yes") {
			const res = await getReply(ownerChannel, (m => m.match(/^[a-zA-Z][0-9][-!$%^&*()_+|~=`{}[\]:";'<>?,./]$/)), "What new prefix would you like? (enter symbol, letters, etc)")
			if (!res) await owner.send(":exclamation: Something went wrong. For now, use `$set` and `$set edit prefix <new prefix>` and so on to configure settings.")
			client.settings.set(guild.id, "prefix", res)
			await owner.send(`Alright! That's us done with ${guild.name} then, ${owner.name}. You can now properly use MemeBot in your server. If you want to disable Investment Watch anytime, just run \`${client.settings.get(guild.id, "prefix")}set edit investmentChannel 0\`. Have fun!`)
		}

		if (prefix.toLowerCase() === "no") {
			await owner.send(`Alright! That's us done with ${guild.name} then, ${owner.name}. You can now properly use MemeBot in your server. If you want to disable Investment Watch anytime, just run \`${client.settings.get(guild.id, "prefix")}set edit investmentChannel 0\`. Have fun!`)
		}
	}

}

const getReply = async (channel, filter, question) => {
	await channel.send(question)
	try {
		const collected = await channel.awaitMessages(filter)
		return collected.first().content
	} catch (e) {
		return false
	}
}
