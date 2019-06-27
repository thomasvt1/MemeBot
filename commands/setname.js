exports.run = async (client, message, [name], level) => {
	if (client.config.node_env === "DEVELOPMENT") return false

	const check = await client.api.getLink(message.author.id)

	if (!name) return message.channel.send(":question: I don't remember your name, and you haven't given me one.\n```Use $setname reddit_username to set your name```")

	if (name.length < 3) return message.channel.send(":thinking: Something tells me that is not a Reddit username")

	const linkcheck = await client.api.getRedditLink(name)

	if (linkcheck) return message.channel.send(`:exclamation: Someone (<@${linkcheck}>) already has this username.`)

	const profile = await client.api.getInvestorProfile(name).catch(err => client.logger.err(err))
	if (profile.id === 0) return message.channel.send(":question: I couldn't find that MemeEconomy user.")

	if (!check) {
		const newlink = await client.api.setLink(message.author.id, profile.name.toLowerCase())
		if (!newlink) return message.channel.send(":x: An error occurred while inserting. Please contact Thomasvt#2563 or Keanu73#2193.")
	} else {
		const update = await client.api.updateLink(message.author.id, name.toLowerCase())
		if (!update) return message.channel.send(":x: An error occurred while updating. Please contact Thomasvt#2563 or Keanu73#2193.")
	}

	return message.channel.send(`:white_check_mark: I will remember that your Reddit username is ${name}`)
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [],
	permLevel: "User"
}

exports.help = {
	name: "setname",
	category: "MemeEconomy",
	description: "Sets your reddit name to act as default for commands",
	usage: "setname <your reddit username>"
}
