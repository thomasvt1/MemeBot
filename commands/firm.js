const { RichEmbed } = require("discord.js")
const moment = require("moment")
const fs = require("fs")
exports.run = async (client, message, [username, _redditlink, user, _history, firm, _firmmembers, firmrole, check], _level) => {
	// Here we calculate the average investment profit of the entire firm
	// by listing out all of each firm member's investments, then pushing them
	// all into one array. We then average them all out.
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

		const member = await client.api.getFirmMembers(user.firm, page, amount).catch(err => client.logger.error(err.stack))
		firmmembers = firmmembers.concat(member)
		num_left -= amount
		if (num_left > 0) page += 1
	}

	for (let i = 0; i < firmmembers.length; i++) {
		let num_left = firmmembers[i].completed
		let page = 0
		let amount = 0

		while (num_left > 0) {
			if (num_left > 100) {
				amount = 100
			} else {
				amount = num_left
			}
			const history = await client.api.getInvestorHistory(firmmembers[i].name, amount, page).catch(err => client.logger.error(err.stack))
			investments = investments.concat(history)
			num_left -= amount
			if (num_left > 0) page += 1
		}
	}

	for (let i = 0; i < investments.length; i++) {
		if (investments[i].done === true) {
			profitprct += (investments[i].profit - investments[i].profit * (investments[i].firm_tax / 100)) / investments[i].amount * 100 // investor profit ratio
		}
	}

	profitprct /= investments.length // Calculate average % return

	// Calculate week's best profiteer, also include contribution to firm balance

	const weekprofiteers = []

	for (const member of firmmembers) {
		const history = await client.api.getInvestorHistory(member.name)
		let weekprofit = 0
		let weekcontrib = 0
		let i = 0
		while (i < history.length && history[i].time > firm.last_payout) {
			weekprofit += history[i].profit - history[i].profit * (history[i].firm_tax / 100)
			weekcontrib += history[i].profit * (history[i].firm_tax / 100)
			i++
		}

		weekprofiteers.push({ name: member.name, profit: weekprofit, contrib: weekcontrib})
	}

	weekprofiteers.sort((a, b) => b.profit - a.profit)

	const weekbestprofiteer = weekprofiteers[0]
	const weekworstprofiteer = weekprofiteers[weekprofiteers.length - 1]
	const bfirmcontribution = weekbestprofiteer.contrib
	const wfirmcontribution = weekworstprofiteer.contrib
	const bfirmconstr = bfirmcontribution > 0 ? `\nContributed **${client.api.numberWithCommas(Math.trunc(bfirmcontribution))}** M¢ to firm (**${((bfirmcontribution / firm.balance) * 100).toFixed(2)}%**)` : ""
	const wfirmconstr = wfirmcontribution > 0 ? `\nContributed **${client.api.numberWithCommas(Math.trunc(wfirmcontribution))}** M¢ to firm (**${((wfirmcontribution / firm.balance) * 100).toFixed(2)}%**)` : ""

	// Calculate most inactive investors and most active investors
	// (in terms of **time difference**, not investments.)
	// List all of them, calculate time difference, format it using moment-duration-format.

	for (const member of firmmembers) {
		// Calculate average investment per day since last firm payout
		let avginvestments = 0
		const history = await client.api.getInvestorHistory(member.name, 50)
		let days = moment().diff(moment.unix(firm.last_payout), "days")
		if (days < 1) days = 7
		for (const inv of history) {
			if (moment().diff(moment.unix(firm.last_payout), "days") > 1 && inv.time < firm.last_payout)
				break
			if (moment().diff(moment.unix(firm.last_payout), "days") < 1 && inv.time < moment.unix(moment().subtract(7, "days")))
				break
			avginvestments++
		}
		avginvestments /= Math.trunc(days)
		member.avginvestments = Math.trunc(avginvestments)
		member.timediff = history[0] ? Math.trunc(new Date().getTime() / 1000) - history[0].time : "Never"
	}

	const inactiveinvestors = firmmembers.sort((a, b) => a.avginvestments - b.avginvestments)
	const activeinvestors = firmmembers.sort((a, b) => b.avginvestments - a.avginvestments)
	const toorecent = moment().diff(moment.unix(firm.last_payout), "days") < 1 ? "last 7 days (payout too recent)" : "last payout"

	const leastactive = inactiveinvestors[0]
	const mostactive = activeinvestors[0]

	const leastactiveinvested = leastactive.timediff === "Never" ? "**Never**" : moment.duration(leastactive.timediff, "seconds").format("[**]Y[**] [year], [**]D[**] [day], [**]H[**] [hour] [and] [**]m[**] [minutes] [ago]")
	const mostactiveinvested = mostactive.timediff === "Never" ? "**Never**" :  moment.duration(mostactive.timediff, "seconds").format("[**]Y[**] [year], [**]D[**] [day], [**]H[**] [hour] [and] [**]m[**] [minutes] [ago]")

	const yourrole = check ? "Your Role" : `${username}'s Role`

	let firmimage = false
	client.guilds.get("563439683309142016").emojis.forEach(async (e) => {
		if (e.name === firm.name.toLowerCase().replace(/ /g, "")) firmimage = e.url
	})

	if (!firmimage) firmimage = "https://cdn.discordapp.com/emojis/588029928063107230.png"

	let board_members = 1

	if (firm.coo !== "0" && firm.coo !== "") board_members += 1

	if (firm.cfo !== "0" && firm.cfo !== "") board_members += 1

	const floor_traders = firm.size - firm.assocs - firm.execs - board_members

	let size = `**${firm.size}** member${firm.size > 1 ? "s" : ""}`
	if (floor_traders > 0) size += `\n**${floor_traders}** floor trader${floor_traders > 1 ? "s" : ""}`
	if (firm.assocs > 0) size += `\n**${firm.assocs}** associate${firm.assocs > 1 ? "s" : ""}`
	if (firm.execs > 0) size += `\n**${firm.execs}** executive${firm.execs > 1 ? "s" : ""}`
	size += `\n**${board_members}** board member${board_members > 1 ? "s" : ""}`

	// When my PR is implemented, replace "Completed investments" with "Rank" (in leaderboard)

	const firminfo = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter("Made by Thomas van Tilburg and Keanu73 with ❤️", "https://i.imgur.com/1t8gmE7.png")
		.setTitle(firm.name)
		.setURL(`https://meme.market/firm.html?firm=${user.firm}`)
		.addField("Balance", `**${client.api.numberWithCommas(firm.balance)}** M¢`, true)
		.addField("Average investment profit", `${profitprct.toFixed(3)}%`, true)
		.addField("Total completed investments", investments.length, true)
		.addField(yourrole, firmrole, true)
		.addField(`Most active investor since ${toorecent}`, `[u/${mostactive.name}](https://meme.market/user.html?account=${mostactive.name})\n**${mostactive.avginvestments}** average investments per day\nLast invested: ${mostactiveinvested}`, true)
		.addField(`Least active investor since ${toorecent}`, `[u/${leastactive.name}](https://meme.market/user.html?account=${leastactive.name})\n**${leastactive.avginvestments}** average investments per day\nLast invested: ${leastactiveinvested}`, true)
		.addField("CEO", `[u/${firm.ceo}](https://meme.market/user.html?account=${firm.ceo})`, true)
		.addField("COO", firm.coo === "" || firm.coo === "0" ? "None" : `[u/${firm.coo}](https://meme.market/user.html?account=${firm.coo})`, true)
		.addField("CFO", firm.cfo === "" || firm.cfo === "0" ? "None" : `[u/${firm.cfo}](https://meme.market/user.html?account=${firm.cfo})`, true)
		.addField("Tax", `${firm.tax}%`, true)
		.addField("Size", size, true)
		.addField("Week's best profiteer", `[u/${weekbestprofiteer.name}](https://meme.market/user.html?account=${weekbestprofiteer.name})\n**${client.api.numberWithCommas(Math.trunc(weekbestprofiteer.profit))}** M¢${bfirmconstr}`, false)
		.addField("Week's worst profiteer", `[u/${weekworstprofiteer.name}](https://meme.market/user.html?account=${weekworstprofiteer.name})\n**${client.api.numberWithCommas(Math.trunc(weekworstprofiteer.profit))}** M¢${wfirmconstr}`, false)
		.setThumbnail(firmimage)
	return message.channel.send({embed: firminfo})
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