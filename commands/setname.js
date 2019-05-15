exports.run = (client, message, [name], level) => {
	
	const check = client.api.getLink(message.author.id)

	if (!name) message.reply(":question: I don't remember your name, and you haven't given me one.\n```Use $setname RedditName to set your name```")

	if (name.length < 3) {
		message.reply(":thinking: Something tells me that is not a Reddit username")
	}

	if (!check) client.api.getInvestorProfile(name).then(body => {
		if (body.id === 0) return message.reply(":question: I couldn't find that user. Sorry")
		if (body.name === name.toLowerCase()) client.api.setLink(message.author.id, body.name)
		return message.reply("I will remember that your Reddit username is " + name)
	})

	const update = client.api.updateLink(message.author.id, name)
	if (!update) return message.reply(":x: An error occurred while updating. Please contact Thomasvt#2563.")

	return message.reply("I will remember that your Reddit username is " + name)
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
