/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* All rights reserved.
*/
const { RichEmbed } = require("discord.js")
const moment = require("moment")
require("moment-duration-format")
exports.run = async (client, message, [username, discord_id, user, history, firm, _firmmembers, _isusername], _level) => {

	// Calculate profit %
	let profitprct = 0
	for (let i = 0; i < history.length; i++) {
		if (history[i].done === true) {
			let profit = history[i].profit
			if (user.firm !== 0) profit -= profit * (history[i].firm_tax / 100)
			profitprct += profit / history[i].amount * 100
		}
	}

	profitprct /= history.length // Calculate average % return

	// Calculate this week's profit
	let weekprofit = 0
	let i = 0
	while (i < history.length && history[i].time > firm.last_payout) {
		let profit = history[i].profit
		if (user.firm !== 0) profit -= profit * (history[i].firm_tax / 100)
		weekprofit += profit
		i++
	}

	// Calculate amount of investments today
	let investments_today = 0
	for (const inv of history) {
		const timediff = Math.trunc(((new Date().getTime() / 1000) - inv.time) / 36e2) // 36e3 will result in hours between date objects
		if (timediff > 24)
			break
		investments_today++
	}

	// Calculate average investments since last payout
	let avginvestments = 0
	for (const inv of history) {
		if (inv.time < firm.last_payout)
			break
		avginvestments++
	}
	avginvestments /= Math.trunc(moment().diff(moment.unix(firm.last_payout), "days"))
	avginvestments = Math.trunc(avginvestments)

	const weekratio = ((weekprofit / (user.networth - weekprofit)) * 100.0).toFixed(2)

	const lastinvested = moment.duration(moment().unix() - history[0].time, "seconds").format("[**]Y[**] [year], [**]D[**] [day], [**]H[**] [hour] [and] [**]m[**] [minutes] [ago]") // 36e3 will result in hours between date objects

	const currentpost = !history[0].done ? await client.api.r.getSubmission(history[0].post).fetch().then((sub) => sub).catch(err => console.error(err)) : false

	let factor
	if (!history[0].done) {
		const array = await client.math.calculate_factor(history[0].upvotes, currentpost.score, user.networth)
		factor = array[0]
	}

	let forecastedprofit = !history[0].done ? history[0].amount * factor / 100 : false
	if (user.firm !== 0 && !history[0].done) forecastedprofit -= forecastedprofit * (firm.tax / 100)

	const profitdifference = !history[0].done ? `\n(${forecastedprofit < 0 ? "-" : "+"}**${client.api.numberWithCommas(Math.trunc(forecastedprofit))}** M¢)` : ""

	const redditpfp = await client.api.r.getUser(username).fetch().then((usr) => usr.icon_img)

	let firmemoji = ""
	client.guilds.get("563439683309142016").emojis.forEach(async (e) => {
		if (e.name === firm.name.toLowerCase().replace(/ /g, "")) firmemoji = `<:${e.identifier.toString()}>`
	})

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
		.addField("Average investment profit", `${profitprct.toFixed(2)}%`, true)
		.addField("Average investments per day", avginvestments, true)
		.addField("Investments in the past day", `${investments_today}`, true)
		.addField("Last invested", `${lastinvested}`, true)
		.addField("This week's profit", `**${client.api.numberWithCommas(Math.trunc(weekprofit))}** M¢`, true)
		.addField("Week profit ratio", `${weekratio}%`, true)
	if (discord_id) stats.setThumbnail(client.users.get(discord_id).displayAvatarURL)
	if (!discord_id) stats.setThumbnail(redditpfp)
	return message.channel.send({ embed: stats })
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [],
	permLevel: "User"
}

exports.help = {
	name: "stats",
	category: "MemeEconomy",
	description: "Checks yours or someone else's stats",
	usage: "stats <reddit username> (uses set default)"
}