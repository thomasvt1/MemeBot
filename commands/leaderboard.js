/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* All rights reserved.
*/
const { RichEmbed } = require("discord.js")
const moment = require("moment")
exports.run = async (client, message, args) => {
	// arguments: <name> <all, traders, assocs, exec, board> <best/worst> <networth, activity, contribution, investments> <page>

	// Here we have a promises variable to store all the API-related requests and
	//  execute all at once for efficiency using Promise.all().
	const promises = []

	// Here we have the username check code found in most of the other commands
	// but is mainly in message.js. It checks if a username is passed and all of that
	// stuff so that you can check your own stats and other people's.
	const perPage = 20
	const settings = await client.getSettings(message.guild)
	let username = args[0] === undefined ? args[0] : args[0].replace(/^((\/|)u\/)/g, "")
	const check = await client.api.getLink(client, message.author.id)
	let isusername = true
	let user = await client.api.getInvestorProfile(username).catch(err => {
		if (err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
		client.logger.error(err.stack)
	})

	if (user.id === 0 && check) {
		user = await client.api.getInvestorProfile(check).catch(err => {
			if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
			client.logger.error(err.stack)
		})
		username = user.name
		isusername = false
	}

	if (username && user.id === 0 && !check) return message.channel.send(":question: I couldn't find that MemeEconomy user.")
	if (username === undefined && user.id === 0 && !check) return message.channel.send(`:question: Please supply a Reddit username, or use \`${settings.prefix}setname <reddit username>\`.`)

	const firm = await client.api.getFirmProfile(user.firm).catch(err => {
		if (err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
		client.logger.error(err.stack)
	})

	// This is where the main command code starts.
	// Here we pass the firm's parameters to then calculate the formula
	// for the estimated payout.
	const payout = await client.math.calculateFirmPayout(firm.balance, firm.size, firm.execs, firm.assocs, firm.cfo, firm.coo)

	// Here we use some ugly hacks to make the rest of the code more dynamic
	// so that it returns either the same value or a nicely formatted value.
	const ranks = { all: "all", traders: "traders", assocs: "assoc", execs: "exec", board: { cfo: "cfo", coo: "coo", ceo: "ceo" } }
	const modifiers = { best: "best", worst: "worst" }
	const types = { networth: "networth", activity: "activity", contribution: "contribution", investments: "investments" }
	const typestrs = { networth: "Net Worth", activity: "Last Invested", contribution: "Contribution", investments: "Average Investments" }
	// Here we check if the user passed a username or not.
	const rankarg = isusername ? args[1] : args[0]
	const modifierarg = isusername ? args[2] : args[1]
	const typearg = isusername ? args[3] : args[2]
	let rank = ""
	let modifier = ""
	let type = ""
	let typestr = ""
	let page = check ? args[4] : args[3]

	if (ranks[rankarg]) rank = ranks[rankarg]

	if (!ranks[rankarg]) return message.channel.send(`:exclamation: Invalid rank type! Refer to ${settings.prefix}help leaderboard.`)

	if (modifiers[modifierarg]) modifier = modifiers[modifierarg]

	if (!modifiers[modifierarg]) return message.channel.send(`:exclamation: Invalid modifier! Refer to ${settings.prefix}help leaderboard.`)

	if (types[typearg]) type = types[typearg]

	if (!types[typearg]) return message.channel.send(`:exclamation: Invalid specifier type! Refer to ${settings.prefix}help leaderboard.`)

	if (typestrs[typearg]) typestr = typestrs[typearg]

	if (page && isNaN(page)) return message.channel.send(":thinking: Is this a real number?")

	if (page && page < 1) return message.channel.send(`:exclamation: There is no page ${page}!`)

	if (!page) page = 1
	let members = []
	let num_left = firm.size
	let fpage = 0
	let amount = 0

	while (num_left > 0) {
		if (num_left > 100) {
			amount = 100
		} else {
			amount = num_left
		}

		const firmmems = type === "networth" ? await client.api.getTopFirmMembers(user.firm, fpage, amount).catch(err => {
			if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
			client.logger.error(err.stack)
		}) : await client.api.getFirmMembers(user.firm, fpage, amount).catch(err => {
			if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
			client.logger.error(err.stack)
		})
		members = members.concat(firmmems)
		num_left -= amount
		if (num_left > 0) fpage += 1
	}

	for (let i = 0; i < members.length; i++) {
		promises.push(client.api.getInvestorHistory(members[i].name, 100).then(history => members[i].history = history).catch(err => {
			if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
			client.logger.error(err.stack)
		}))
	}

	await Promise.all(promises)

	for (let i = 0; i < members.length; i++) {
		const history = members[i].history
		let weekcontrib = 0
		let e = 0
		let networth = type === "networth" ? members[i].networth : members[i].balance
		while (e < history.length && history[e].time > firm.last_payout) {
			if (!history[e].done && type !== "networth") networth += history[e].amount
			weekcontrib += history[e].profit * (history[e].firm_tax / 100)
			e++
		}

		let avginvestments = 0
		const days = moment().diff(moment.unix(firm.last_payout), "days")
		for (const inv of history) {
			if (inv.time < firm.last_payout)
				break
			avginvestments++
		}
		if (days < 1) avginvestments = "Payout too recent"
		else {
			avginvestments /= days
			avginvestments = Math.trunc(avginvestments)
		}
		const payouts = {
			"": payout.trader.amount,
			"assoc": payout.assoc.amount,
			"exec": payout.exec.amount,
			"coo": payout.board.amount,
			"cfo": payout.board.amount,
			"ceo": payout.board.amount
		}
		const userpayout = payouts[members[e].firm_role]

		members[i].avginvestments = avginvestments
		members[i].timediff = history[0] ? Math.trunc(new Date().getTime() / 1000) - history[0].time : "Never"
		members[i].contribution = Math.trunc(weekcontrib)
		members[i].networth = networth
		members[i].difference = ((weekcontrib - userpayout) / userpayout) * 100.0
	}

	const begin = page === 1 ? 0 : (perPage * page) - perPage
	const offset = (perPage * page)
	const ioffset = page === 1 ? 1 : (perPage * (page - 1)) + 1
	let firmmembers = rank !== "all" ? members.filter(mem => typeof rank === "object" && rank[mem.firm_role] || rank === "traders" && mem.firm_role === "" || mem.firm_role === rank && rank !== "traders") : members
	const pages = Math.ceil(firmmembers.length / perPage)
	if (type === "networth") {
		if (modifier === "worst") firmmembers.sort((a, b) => a.networth - b.networth)
	}

	if (type === "activity") {
		if (modifier === "best") firmmembers.sort((a, b) => a.timediff - b.timediff)
		if (modifier === "worst") firmmembers.sort((a, b) => b.timediff - a.timediff)
	}

	if (type === "contribution") {
		if (modifier === "best") firmmembers.sort((a, b) => b.contribution - a.contribution)
		if (modifier === "worst") firmmembers.sort((a, b) => a.contribution - b.contribution)
	}

	if (type === "investments") {
		if (modifier === "best") firmmembers.sort((a, b) => b.avginvestments - a.avginvestments)
		if (modifier === "worst") firmmembers.sort((a, b) => a.avginvestments - b.avginvestments)
	}

	firmmembers = firmmembers.slice(begin, offset)

	const firmranks = {
		all: "",
		traders: "Floor Traders",
		assocs: "Associates",
		execs: "Executives",
		board: "Board Members"
	}

	const firmroles = {
		"": "Floor Trader",
		assoc: "Associate",
		exec: "Executive",
		coo: "COO",
		cfo: "CFO",
		ceo: "CEO"
	}

	let firmimage = "https://cdn.discordapp.com/emojis/588029928063107230.png"
	client.guilds.get("563439683309142016").emojis.forEach(async (e) => {
		if (e.name === firm.name.toLowerCase().replace(/ /g, "")) firmimage = e.url
	})

	const stats = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter(`Page ${page} of ${pages} | Made by Thomas van Tilburg and Keanu73 with ❤️`, "https://i.imgur.com/1t8gmE7.png")
		.setTitle(`${modifiers[modifierarg] === "best" ? "Top" : "Bottom"} ${rank === "all" ? "Investors" : firmranks[rankarg]} of ${firm.name} by ${typestr}`)
		.setURL(`https://meme.market/firm.html?firm=${firm.id}`)
		.setThumbnail(firmimage)

	await firmmembers
	for (let i = 0; i < firmmembers.length; i++) {
		const investor = firmmembers[i]
		const lastinvested = investor.timediff !== "Never" ? moment.duration(investor.timediff, "seconds").format("[**]Y[**] [year], [**]D[**] [day], [**]H[**] [hour] [and] [**]m[**] [minutes] [ago]") : "Never"
		const ifirmrole = firmroles[investor.firm_role]
		stats.addField(`\`${i + ioffset}.\` u/${investor.name} - ${ifirmrole}`, `
💰 \`Net worth:\` **${client.api.getSuffix(investor.networth)}** M¢
📤 \`Contribution since payout:\` **${client.api.numberWithCommas(investor.contribution)}** M¢
🎯 \`Contribution / payout:\` **${investor.difference.toFixed(2)}**%
🏅 \`Average investments per day:\` **${investor.avginvestments}**
🎖 \`Completed investments:\` **${investor.completed}**
⏲ \`Last invested:\` ${lastinvested}\n${i === firmmembers.length ? "" : "\u200b"}`, false)
	}

	return message.channel.send({ embed: stats })
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: ["lb"],
	permLevel: "User"
}

exports.help = {
	name: "leaderboard",
	category: "MemeEconomy",
	description: "Shows you the top members of your firm sorted by arguments. (networth == sorted by networth, activity == sorted by last invested at, contribution === sorted by firm contribution, investments === sorted by average investments)",
	usage: "leaderboard [all, traders, assocs, execs, board] [best, worst] [networth, activity, contribution, investments] [page]"
}
