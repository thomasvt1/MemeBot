/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* All rights reserved.
*/

const { RichEmbed } = require("discord.js")
const moment = require("moment")
exports.run = async (client, message, [page], _level) => {
	if (page > 4 || page < 1) return message.channel.send(`:exclamation: There is no page ${page}!`)

	if (isNaN(page)) return message.channel.send(":thinking: Is this a real number?")
	if (!page) page = 1
	const top100 = await client.api.getTop100(25, page - 1).then(body => body).catch(err => {
		if (err.statusCode !== 200) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
		client.logger.error(err.stack)
	})
	const offset = page === 1 ? 1 : (25 * (page - 1)) + 1
	const top100firms = []

	const firmroles = {
		"": "Floor Trader",
		assoc: "Associate",
		exec: "Executive",
		coo: "COO",
		cfo: "CFO",
		ceo: "COO"
	}

	const stats = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter(`Page ${page} of 4 | Made by Thomas van Tilburg and Keanu73 with ❤️`, "https://i.imgur.com/1t8gmE7.png")
		.setTitle("Top 100 Investors of /r/MemeEconomy")
		.setURL("https://meme.market/leaderboards.html?season=1")
	
	for (let f = 0; f < 25; f++) {
		const investor = top100[f]
		const ifirm = investor.firm !== 0 ? await client.api.getFirmProfile(investor.firm).catch(err => client.logger.error(err.stack)) : false
		!ifirm ? top100firms.push(false) : top100firms.push({ firm: ifirm.name, firmrole: firmroles[investor.firm_role] })
	}

	for (let i = 0; i < 25; i++) {
		const investor = top100[i]
		const ihistory = await client.api.getInvestorHistory(investor.name.toLowerCase()).catch(err => client.logger.error(err.stack))
		const lastinvested = ihistory[0] ? moment.duration(moment().unix() - ihistory[0].time, "seconds").format("[**]Y[**] [year], [**]D[**] [day], [**]H[**] [hour] [and] [**]m[**] [minutes] [ago]") : "Never"
		const ifirmrole = top100firms[i].firmrole
		const ifirm = top100firms[i].firm
		let firmemoji = ""
		client.guilds.get("563439683309142016").emojis.forEach(async (e) => {
			if (ifirm && e.name === ifirm.toLowerCase().replace(/ /g, "")) firmemoji = `<:${e.identifier.toString()}>`
		})

		const firm = top100firms[i] ? `\n\`Firm:\` **${ifirmrole}** of **${ifirm}**` : ""
		stats.addField(`\`${i + offset}.\` u/${investor.name} ${firmemoji}`, `
\`Net worth:\` **${client.api.getSuffix(investor.networth)} M¢**${firm}
\`Completed investments:\` **${investor.completed}**
\`Last invested:\` ${lastinvested}`, false)
	}

	return message.channel.send({embed: stats})
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
