/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* All rights reserved.
*/
const { RichEmbed } = require("discord.js")
const moment = require("moment")
require("moment-duration-format")
exports.run = async (client, message, _args, [user, discord_id, history, firm], _level) => {
	let profitdifference
	let profitprct
	let avginvestments
	let investments_today
	let lastinvested
	let weekprofit
	let weekratio
	let currentpost

	if (history && history.length) {
		// Calculate profit %
		profitprct = 0
		for (let i = 0; i < history.length; i++) {
			if (history[i].done === true) {
				let profit = history[i].profit
				if (user.firm !== 0) profit -= profit * (history[i].firm_tax / 100)
				profitprct += profit / history[i].amount * 100
			}
		}

		profitprct /= history.length // Calculate average % return

		// Calculate this week's profit
		weekprofit = 0
		let i = 0
		// If user is in firm, calculate it since last payout, else, do it in the past week
		const week = user.firm !== 0 ? firm.last_payout : moment().subtract(7, "days").unix()
		while (i < history.length && history[i].time > week) {
			let profit = history[i].profit
			if (user.firm !== 0) profit -= profit * (history[i].firm_tax / 100)
			weekprofit += profit
			i++
		}

		// Calculate amount of investments today
		investments_today = 0
		for (const inv of history) {
			const timediff = Math.trunc(((new Date().getTime() / 1000) - inv.time) / 36e2) // 36e3 will result in hours between date objects
			if (timediff > 24)
				break
			investments_today++
		}

		// Calculate average investments since last payout
		avginvestments = 0
		const weekago = moment().subtract(7, "days").unix()
		for (const inv of history) {
			if (inv.time < weekago)
				break
			avginvestments++
		}

		avginvestments /= 7
		avginvestments = Math.trunc(avginvestments)

		// Here we just do some hacky math to spit out a profit ratio.
		weekratio = ((weekprofit / (user.networth - weekprofit)) * 100.0).toFixed(2)

		// Self-explanatory
		lastinvested = moment.duration(moment().unix() - history[0].time, "seconds").format("[**]Y[**] [year], [**]D[**] [day], [**]H[**] [hour] [and] [**]m[**] [minutes] [ago]") // 36e3 will result in hours between date objects

		// Fetch current investment from reddit
		currentpost = !history[0].done ? await client.api.r.getSubmission(history[0].post).fetch().then((sub) => sub).catch(err => client.logger.error(err.stack)) : false

		// Calculate the estimated profit that is added onto your networth
		let factor
		if (!history[0].done) {
			const array = await client.math.calculate_factor(history[0].upvotes, currentpost.score, user.networth)
			factor = array[0]
		}

		let forecastedprofit = !history[0].done ? history[0].amount * factor / 100 : false
		if (user.firm !== 0 && !history[0].done) forecastedprofit -= forecastedprofit * (firm.tax / 100)

		profitdifference = !history[0].done ? `\n(${forecastedprofit < 0 ? "" : "+"}**${client.api.numberWithCommas(Math.trunc(forecastedprofit))}** M¢)` : ""
	}

	const redditpfp = await client.api.r.getUser(user.name).fetch().then((usr) => usr.icon_img).catch(err => client.logger.error(err.stack))

	const firmemoji = firm.id !== 0 ? client.firmEmoji(firm.name) : ""

	const firmroles = {
		"": "Floor Trader",
		assoc: "Associate",
		exec: "Executive",
		coo: "COO",
		cfo: "CFO",
		ceo: "CEO"
	}

	const stats = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter("Made by Thomas van Tilburg and Keanu73 with ❤️", "https://i.imgur.com/1t8gmE7.png")
		.setTitle(`u/${user.name} ${firmemoji}`)
		.setURL(`https://meme.market/user.html?account=${user.name}`)
		.addField("Net worth", `**${client.api.numberWithCommas(user.networth)}** M¢ ${profitdifference}`, true)
		.addField("Completed investments", `${client.api.numberWithCommas(user.completed)}`, true)
		.addField("Rank", `**\`#${user.rank}\`**`, true)
	if (user.firm !== 0) stats.addField("Firm", `**\`${firmroles[user.firm_role]}\`** of **\`${firm.name}\`**`, true)
	if (history && history.length) {
		stats.addField("Average investment profit", `${profitprct.toFixed(2)}%`, true)
			.addField("Average investments per day", avginvestments, true)
			.addField("Investments in the past day", `${investments_today}`, true)
			.addField("Last invested", `${lastinvested}`, true)
			.addField("This week's profit", `**${client.api.numberWithCommas(Math.trunc(weekprofit))}** M¢`, true)
			.addField("Week profit ratio", `${weekratio}%`, true)
	}
	if (discord_id) stats.setThumbnail(client.users.get(discord_id).displayAvatarURL)
	if (!discord_id) stats.setThumbnail(redditpfp)
	return message.channel.send({ embed: stats })
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [],
	permLevel: "User",
	info: ["user", "discord_id", "history", "firm"]
}

exports.help = {
	name: "stats",
	category: "MemeEconomy",
	description: "Checks yours or someone else's stats",
	usage: "stats <reddit username> (uses set default)"
}