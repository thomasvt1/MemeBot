/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* All rights reserved.
*/

exports.run = async (client, message, [name], _level) => {
	const check = await client.api.getLink(client, message.author.id).catch(err => client.logger.error(err.stack))

	if (!name && !check) return message.channel.send(":question: I don't remember your name, and you haven't given me one.\n```Use $setname reddit_username to set your name```")
	if (!name && check) return message.channel.send(`:question: You haven't given me what you want to change your name to, ${check}.`)
	if (name.length < 3) return message.channel.send(":thinking: Something tells me that is not a Reddit username")

	const linkcheck = await client.api.getRedditLink(client, name).catch(err => client.logger.error(err.stack))
	if (linkcheck) return message.channel.send(`:exclamation: Someone (<@${linkcheck}>) already has this username.`)

	const profile = await client.api.getInvestorProfile(name).catch(err => {
		if (err.statusCode !== 200) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
		client.logger.error(err.stack)
	})
	if (profile.id === 0) return message.channel.send(":question: I couldn't find that MemeEconomy user.")

	if (!check) {
		const newlink = await client.api.setLink(client, message.author.id, profile.name.toLowerCase()).catch(err => client.logger.error(err.stack))
		if (!newlink) return message.channel.send(":x: An error occurred while inserting. Please contact Thomasvt#2563 or Keanu73#2193.")
	} else {
		const update = await client.api.updateLink(client, message.author.id, name.toLowerCase()).catch(err => client.logger.error(err.stack))
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
