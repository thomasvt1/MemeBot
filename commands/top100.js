/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* All rights reserved.
*/

const { RichEmbed } = require("discord.js")
const moment = require("moment")
exports.run = async (client, message, [page], _level) => {
	// Here we have a promises variable to store all the API-related requests and
	// execute all at once for efficiency using Promise.all().
	const promises = []

	const perPage = 20
	const pages = 100 / perPage
	if (page > pages || page < 1) return message.channel.send(`:exclamation: There is no page ${page}!`)

	if (!page) page = 1
	const top100 = await client.api.getTop100(perPage, page - 1).then(body => body).catch(err => {
		if (err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
		client.logger.error(err.stack)
	})
	// We need an offset so we can display the rank positions correctly.
	const offset = page === 1 ? 1 : (perPage * (page - 1)) + 1

	// Standard breadboard of firmroles.
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
		.setFooter(`Page ${page} of ${pages} | Made by Thomas van Tilburg and Keanu73 with ❤️`, "https://i.imgur.com/1t8gmE7.png")
		.setTitle("Top 100 Investors of /r/MemeEconomy")
		.setThumbnail(client.user.avatarURL)
		.setURL("https://meme.market/leaderboards.html?season=1")

	for (let i = 0; i < perPage; i++) {
		const investor = top100[i]
		// Use promise hacks to perform all web requests at once. Faster runtime.
		promises.push(client.api.getFirmProfile(investor.firm).then(firm => top100[i].firm = firm).catch(err => {
			if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
			client.logger.error(err.stack)
		}))

		promises.push(client.api.getInvestorHistory(investor.name).then(history => top100[i].history = history).catch(err => {
			if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
			client.logger.error(err.stack)
		}))
	}

	// And.. fin.
	await Promise.all(promises)

	for (let i = 0; i < perPage; i++) {
		const investor = top100[i]
		const firmrole = firmroles[investor.firm_role]
		const firm = investor.firm
		const history = investor.history

		const lastinvested = history[0] ? moment.duration(moment().unix() - history[0].time, "seconds").format("[**]Y[**] [year], [**]D[**] [day], [**]H[**] [hour] [and] [**]m[**] [minutes] [ago]") : "Never"		

		let avginvestments = 0
		const weekago = moment().subtract(7, "days").unix()
		for (const inv of history) {
			if (inv.time < weekago)
				break
			avginvestments++
		}

		avginvestments /= 7
		avginvestments = Math.trunc(avginvestments)

		// We get their firm emoji from the MemeBot guild, which has most firm emojis formatted by the firm name but lowercased and spaces truncated.
		const firmemoji = client.firmEmoji(firm.name)

		// Using fancy emojis like in $leaderboard, more readability..
		const firmstr = firm.id !== 0 ? `\n👔 \`Firm:\` **${firmrole}** of **${firm.name}**` : ""
		stats.addField(`\`${i + offset}.\` u/${investor.name} ${firmemoji}`, `
💰 \`Net worth:\` **${client.api.getSuffix(investor.networth)} M¢**${firmstr}
🏅 \`Average investments per day:\` **${avginvestments}**
🎖 \`Completed investments:\` **${investor.completed}**
⏲ \`Last invested:\` ${lastinvested}`, false)
	}

	return message.channel.send({ embed: stats })
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [],
	permLevel: "User"
}

exports.help = {
	name: "top100",
	category: "MemeEconomy",
	description: "Shows you the top 100 investors and their profiles.",
	usage: "top100"
}
