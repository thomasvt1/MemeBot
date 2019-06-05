// This event executes when a new guild (server) is joined.

module.exports = async (client, guild) => {
	client.logger.cmd(`[GUILD JOIN] ${guild.name} (${guild.id}) added the bot. Owner: ${guild.owner.user.tag} (${guild.owner.user.id})`)

	client.settings.set(guild.id, client.config.defaultSettings)

	client.users.get(guild.ownerID).send(":wave: Hello! I'm **MemeBot**, the MemeEconomy bot which gives you statistics and more.")
	client.users.get(guild.ownerID).send("To configure your guild's settings, head over to your server and type in `&set`.\nOnce you've had a good look over what options you want to change, type in `&set edit <option> <value>`.")
	client.users.get(guild.ownerID).send("If you want to enable **Investment Watch** (https://i.imgur.com/cFAUn8B.png), you will need to run `&set edit investmentChannel <mention channel here>`.")
	client.users.get(guild.ownerID).send("If you want it to mention **everyone**, you can type `&set edit mentionEveryone true`.")
	client.users.get(guild.ownerID).send("You can also change the prefix by doing `&set edit prefix <insert symbol here>`.")
	client.users.get(guild.ownerID).send("If you have **any** questions, you can join the official MemeBot Discord server here: https://discord.gg/HpNxdcY")
}
