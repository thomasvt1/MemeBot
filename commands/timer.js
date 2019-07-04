/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* All rights reserved.
*/

const moment = require("moment")
const setTimeoutAt = require("safe-timers").setTimeoutAt
exports.run = async (client, message, [_username, _redditlink, _user, history, _firm, _firmmembers, _firmrole, _check], _level) => {

	const currentinvestment = history[0]
	if (currentinvestment.done) return message.channel.send(":exclamation: You don't have an active investment!")

	const timediff = currentinvestment.time + 14400
	const timeout = timediff * 1000
	const maturesin = moment.duration(timediff - moment().unix(), "seconds").format("[**]H[**] [hour] [and] [**]m[**] [minutes]")

	message.channel.send(`:white_check_mark: I will remind you in DMs when your investment has matured in ${maturesin}.`)
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