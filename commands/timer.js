/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* All rights reserved.
*/

const moment = require("moment")
const setTimeoutAt = require("safe-timers").setTimeoutAt
exports.run = async (client, message, args, _level) => {
	const settings = await client.getSettings(message.guild)
	let username = args[0] === undefined ? args[0] : args[0].replace(/^((\/|)u\/)/g, "")
	const check = await client.api.getLink(client, message.author.id)
	let user
	let isusername = true
	if (username !== undefined) {
		user = await client.api.getInvestorProfile(username).catch(err => {
			if (err.statusCode !== 200) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
			client.logger.error(err.stack)
		})
	}
	if (user === undefined && check) {
		user = await client.api.getInvestorProfile(check).catch(err => {
			if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
			client.logger.error(err.stack)
		})
		username = user.name
		isusername = false
	}

	if (username && user.id === 0 && !check) return message.channel.send(":question: I couldn't find that MemeEconomy user.")
	if (username === undefined && user.id === 0 && !check) return message.channel.send(`:question: Please supply a Reddit username, or use \`${settings.prefix}setname <reddit username>\`.`)

	const history = await client.api.getInvestorHistory(username.toLowerCase()).catch(err => {
		if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
		client.logger.error(err.stack)
	})

	const currentinvestment = history[0]
	if (currentinvestment.done) return message.channel.send(`:exclamation: ${isusername ? "They" : "You"} don't have an active investment!`)

	const timediff = currentinvestment.time + 14400
	const timeout = timediff * 1000
	const maturesin = moment.duration(timediff - moment().unix(), "seconds").format("[**]H[**] [hour] [and] [**]m[**] [minutes]")

	message.channel.send(`:bell: I will remind you in DMs when your investment has matured in ${maturesin}.`)
	return setTimeoutAt(async () => client.users.get(message.author.id).send("Your investment has matured!"), timeout)
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [],
	permLevel: "User"
}

exports.help = {
	name: "timer",
	category: "MemeEconomy",
	description: "Sends you a message when your current investment is done",
	usage: "timer"
}