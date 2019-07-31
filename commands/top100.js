/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* All rights reserved.
*/

const { RichEmbed } = require("discord.js")
const moment = require("moment")
exports.run = async (client, message, [type, page], _level) => {
	// Here we have a promises variable to store all the API-related requests and
	// execute all at once for efficiency using Promise.all().
	const promises = []

	const types = { "investors": "investors", "firms": "firms" }
	
	if (!types[type]) return message.channel.send(":exclamation: Invalid type! You can only use `investors` or `firms`.")

	if (type === "investors") {
		const perPage = 20
		const pages = 100 / perPage
		if (page > pages || page < 1) return message.channel.send(`:exclamation: There is no page ${page}!`)

		if (!page) page = 1

		// We need an offset so we can display the rank positions correctly.
		const offset = page === 1 ? 1 : (perPage * (page - 1)) + 1

		const top100 = await client.api.getTop100(perPage, page - 1).catch(err => {
			if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
			client.logger.error(err.stack)
		})

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
			promises.push(investor.firm ? client.api.getFirmProfile(investor.firm).then(firm => top100[i].firm = firm).catch(err => {
				if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
				client.logger.error(err.stack)
			}) : top100[i].firm = { id: 0 })

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
			const firmemoji = firm.id !== 0 ? client.firmEmoji(firm.name) : ""

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

	if (type === "firms") {
		const perPage = 10
		const pages = 100 / perPage
		if (page > pages || page < 1) return message.channel.send(`:exclamation: There is no page ${page}!`)

		if (!page) page = 1

		// We need an offset so we can display the rank positions correctly.
		const offset = page === 1 ? 1 : (perPage * (page - 1)) + 1

		const top100 = await client.api.getTop100Firms(perPage, page - 1).catch(err => {
			if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
			client.logger.error(err.stack)
		})

		const stats = new RichEmbed()
			.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
			.setColor("GOLD")
			.setFooter(`Page ${page} of ${pages} | Made by Thomas van Tilburg and Keanu73 with ❤️`, "https://i.imgur.com/1t8gmE7.png")
			.setTitle("Top 100 Firms of /r/MemeEconomy")
			.setThumbnail(client.user.avatarURL)
			.setURL("https://meme.market/firm-leaderboard.html")

		for (let i = 0; i < perPage; i++) {
			const firm = top100[i]
			// Here we have a promises variable to store all the API-related requests and
			// execute all at once for efficiency using Promise.all().
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

				const members = await client.api.getFirmMembers(firm.id, page, amount).catch(err => {
					if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
					client.logger.error(err.stack)
				})
				firmmembers = firmmembers.concat(members)
				num_left -= amount
				if (num_left > 0) page += 1
			}

			for (let i = 0; i < firmmembers.length; i++) {
				// We use promise hacks here just so you don't wait for ages.
				promises.push(client.api.getInvestorHistory(firmmembers[i].name, 100).then(history => {
					investments = investments.concat(history)
					firmmembers[i].history = history
				}).catch(err => {
					if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
					client.logger.error(err.stack)
				}))
			}

			await Promise.all(promises)

			// We calculate average investment profit since 7 days ago (a week ago).
			for (let i = 0; i < investments.length; i++) {
				if (investments[i].done === true && investments[i].time > moment().subtract(7, "days").unix()) {
					profitprct += (investments[i].profit - investments[i].profit * (investments[i].firm_tax / 100)) / investments[i].amount * 100 // investor profit ratio
				}
			}

			profitprct /= investments.length // Calculate average % return

			let board_members = 1

			if (firm.coo !== "0" && firm.coo !== "") board_members += 1

			if (firm.cfo !== "0" && firm.cfo !== "") board_members += 1

			const floor_traders = firm.size - firm.assocs - firm.execs - board_members

			let size = `**${firm.size}** member${firm.size > 1 ? "s" : ""}`
			if (floor_traders > 0) size += `\n**${floor_traders}** floor trader${floor_traders > 1 ? "s" : ""}`
			if (firm.assocs > 0) size += `\n**${firm.assocs}** associate${firm.assocs > 1 ? "s" : ""}`
			if (firm.execs > 0) size += `\n**${firm.execs}** executive${firm.execs > 1 ? "s" : ""}`
			size += `\n**${board_members}** board member${board_members > 1 ? "s" : ""}`

			// We get their firm emoji from the MemeBot guild, which has most firm emojis formatted by the firm name but lowercased and spaces truncated.
			const firmemoji = client.firmEmoji(firm.name)

			// Using fancy emojis like in $leaderboard, more readability..
			stats.addField(`\`${i + offset}.\` ${firm.name} ${firmemoji}`, `
💰 \`Balance:\` **${client.api.getSuffix(firm.balance)} M¢**
📥 \`Average investment profit:\` **${profitprct.toFixed(3)}%**
👔 \`CEO:\` **[u/${firm.ceo}](https://meme.market/user.html?account=${firm.ceo})**
👔 \`COO:\` **${firm.coo === "" || firm.coo === "0" ? "None" : `[u/${firm.coo}](https://meme.market/user.html?account=${firm.coo})`}**
👔 \`CFO:\` **${firm.cfo === "" || firm.cfo === "0" ? "None" : `[u/${firm.cfo}](https://meme.market/user.html?account=${firm.cfo})`}**
🏛 \`Size:\` ${size}
💸 \`Tax:\` **${firm.tax}%**`, false)
		}

		return message.channel.send({ embed: stats })
	}
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
