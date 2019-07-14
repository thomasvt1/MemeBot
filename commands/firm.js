/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* All rights reserved.
*/

const { RichEmbed } = require("discord.js")
exports.run = async (client, message, [username, _discord_id, user, _history, firm, isusername], _level) => {
	if (firm.id === 0) return message.channel.send(`:exclamation: ${isusername ? `${username} is` : "You are"} not in a firm!`)

	// Here we have a promises variable to store all the API-related requests and
	//  execute all at once for efficiency using Promise.all().
	const promises = []

	// Here we gather up all of the firm members by keeping track of
	// how many we have left and so on, combining them into one array.
	let firmmembers = []
	let investments = []
	let profitprct = 0

	let num_left = firm.size
	let page = 0
	let amount = 0

	while (num_left > 0) {
		if (num_left > 100) {
			amount = 100
		} else {
			amount = num_left
		}

		const members = await client.api.getFirmMembers(user.firm, page, amount).catch(err => {
			if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
			client.logger.error(err.stack)
		})
		firmmembers = firmmembers.concat(members)
		num_left -= amount
		if (num_left > 0) page += 1
	}

	for (let i = 0; i < firmmembers.length; i++) {
		promises.push(client.api.getInvestorHistory(firmmembers[i].name, 100).then(history => {
			investments = investments.concat(history)
			firmmembers[i].history = history
		}).catch(err => {
			if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
			client.logger.error(err.stack)
		}))
	}

	await Promise.all(promises)

	for (let i = 0; i < investments.length; i++) {
		if (investments[i].done === true && investments[i].time > firm.last_payout) {
			profitprct += (investments[i].profit - investments[i].profit * (investments[i].firm_tax / 100)) / investments[i].amount * 100 // investor profit ratio
		}
	}

	profitprct /= investments.length // Calculate average % return

	const yourrole = isusername ? "Their Role" : "Your Role"

	let firmimage = "https://cdn.discordapp.com/emojis/588029928063107230.png"
	client.guilds.get("563439683309142016").emojis.forEach(async (e) => {
		if (e.name === firm.name.toLowerCase().replace(/ /g, "")) firmimage = e.url
	})

	let board_members = 1

	if (firm.coo !== "0" && firm.coo !== "") board_members += 1

	if (firm.cfo !== "0" && firm.cfo !== "") board_members += 1

	const floor_traders = firm.size - firm.assocs - firm.execs - board_members

	let size = `**${firm.size}** member${firm.size > 1 ? "s" : ""}`
	if (floor_traders > 0) size += `\n**${floor_traders}** floor trader${floor_traders > 1 ? "s" : ""}`
	if (firm.assocs > 0) size += `\n**${firm.assocs}** associate${firm.assocs > 1 ? "s" : ""}`
	if (firm.execs > 0) size += `\n**${firm.execs}** executive${firm.execs > 1 ? "s" : ""}`
	size += `\n**${board_members}** board member${board_members > 1 ? "s" : ""}`

	const firmroles = {
		"": "Floor Trader",
		assoc: "Associate",
		exec: "Executive",
		coo: "COO",
		cfo: "CFO",
		ceo: "CEO"
	}

	const firmrole = firmroles[user.firm_role]

	// When my PR is implemented, replace "Completed investments" with "Rank" (in leaderboard) (it was below average investment profit)

	const firminfo = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter("Made by Thomas van Tilburg and Keanu73 with ❤️", "https://i.imgur.com/1t8gmE7.png")
		.setTitle(firm.name)
		.setURL(`https://meme.market/firm.html?firm=${user.firm}`)
		.addField("Balance", `**${client.api.numberWithCommas(firm.balance)}** M¢`, true)
		.addField("Average investment profit", `${profitprct.toFixed(3)}%`, true)
		.addField(yourrole, firmrole, true)
		.addField("CEO", `[u/${firm.ceo}](https://meme.market/user.html?account=${firm.ceo})`, true)
		.addField("COO", firm.coo === "" || firm.coo === "0" ? "None" : `[u/${firm.coo}](https://meme.market/user.html?account=${firm.coo})`, true)
		.addField("CFO", firm.cfo === "" || firm.cfo === "0" ? "None" : `[u/${firm.cfo}](https://meme.market/user.html?account=${firm.cfo})`, true)
		.addField("Size", size, true)
		.addField("Tax", `${firm.tax}%`, true)
		.setThumbnail(firmimage)
	return message.channel.send({ embed: firminfo })
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [],
	permLevel: "User"
}

exports.help = {
	name: "firm",
	category: "MemeEconomy",
	description: "Presents various statistics about a firm.",
	usage: "inactive <reddit username> (uses set default)"
}
