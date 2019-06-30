/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* Last modified by Keanu73 <keanu@keanu73.net> on 2019-06-30
/* All rights reserved.
*/
const { RichEmbed } = require("discord.js")
const moment = require("moment")
exports.run = async (client, message, args) => {
	// arguments: <name> <all, traders, assocs, exec, board> <best/worst> <networth, activity, contribution, investments> <page>
	const settings = message.guild ? client.getSettings(message.guild.id) : client.settings.get("default")
	const perPage = 20
	const check = await client.api.getLink(message.author.id)

	if (!args[0] && !check) return message.channel.send(":question: Please supply a Reddit username.")

	if (args[0].length < 3 && !check) return message.channel.send(":thinking: Something tells me that is not a Reddit username")

	args[0] = args[0].replace(/^((\/|)u\/)/g, "")
	const username = check ? check : args[0]

	const profile = await client.api.getInvestorProfile(username.toLowerCase()).catch(err => client.logger.error(err.stack))
	if (profile.id === 0) return message.channel.send(":question: I couldn't find that MemeEconomy user.")

	const firm = await client.api.getFirmProfile(profile.firm).catch(err => client.logger.error(err.stack))
	const payout = await client.math.calculateFirmPayout(firm.balance, firm.size, firm.execs, firm.assocs, firm.cfo !== "" && firm.cfo !== "0" ? firm.cfo : false, firm.coo !== "" && firm.coo !== "0" ? firm.coo : false)

	const ranks = {all: "all", traders: "traders", assocs: "assoc", execs: "exec", board: { cfo: "cfo", coo: "coo", ceo: "ceo"} }
	const modifiers = { best: "best", worst: "worst" }
	const types = { networth: "networth", activity: "activity", contribution: "contribution", investments: "investments" }
	const rankarg = check ? args[0] : args[1]
	const modifierarg = check ? args[1] : args[2]
	const typearg = check ? args[2] : args[3] 
	let rank = ""
	let modifier = ""
	let type = ""
	let page = check ? args[3] : args[4]

	if (ranks[rankarg]) rank = ranks[rankarg]

	if (rank === "") return message.channel.send(`:exclamation: Invalid rank type! Refer to ${settings.prefix}help leaderboard.`)

	if (modifiers[modifierarg]) modifier = modifiers[modifierarg]

	if (modifier === "") return message.channel.send(`:exclamation: Invalid modifier! Refer to ${settings.prefix}help leaderboard.`)

	if (types[typearg]) type = types[typearg]

	if (type === "") return message.channel.send(`:exclamation: Invalid specifier type! Refer to ${settings.prefix}help leaderboard.`)

	if (page && page < 1) return message.channel.send(`:exclamation: There is no page ${page}!`)

	if (!page) page = 1
	let firmmems = []
	let num_left = firm.size
	let fpage = 0
	let amount = 0

	while (num_left > 0) {
		if (num_left > 100) {
			amount = 100
		} else {
			amount = num_left
		}

		const members = type === "networth" ? await client.api.getTopFirmMembers(profile.firm, fpage, amount).catch(err => client.logger.error(err.stack)) : await client.api.getFirmMembers(profile.firm, fpage, amount).catch(err => client.logger.error(err.stack))
		for (let e = 0; e < members.length; e++) {
			const history = await client.api.getInvestorHistory(members[e].name.toLowerCase()).catch(err => client.logger.error(err.stack))
			let weekcontrib = 0
			let i = 0
			let networth = type === "networth" ? members[e].networth : members[e].balance
			while (i < history.length && history[i].time > firm.last_payout) {
				if (!history[i].done && type !== "networth") networth += history[i].amount
				weekcontrib += history[i].profit * (history[i].firm_tax / 100)
				i++
			}

			let avginvestments = 0
			for (const inv of history) {
				if (inv.time < firm.last_payout)
					break
				avginvestments++
			}
			avginvestments /= Math.trunc(moment().diff(moment.unix(firm.last_payout), "days"))
			avginvestments = Math.trunc(avginvestments)

			const payouts = {
				"": payout.trader.amount,
				"assoc": payout.assoc.amount,
				"exec": payout.exec.amount,
				"coo": payout.board.amount,
				"cfo": payout.board.amount,
				"ceo": payout.board.amount
			}
			const userpayout = payouts[members[e].firm_role]

			members[e].avginvestments = avginvestments
			members[e].timediff = history[0] ? Math.trunc(new Date().getTime() / 1000) - history[0].time : "Never"
			members[e].contribution = Math.trunc(weekcontrib)
			members[e].history = history
			members[e].networth = networth
			members[e].difference = ((weekcontrib - userpayout) / userpayout) * 100.0
		}
		firmmems = firmmems.concat(members)
		num_left -= amount
		if (num_left > 0) fpage += 1
	}

	const begin = page === 1 ? 0 : (perPage * page) - perPage
	const offset = (perPage * page)
	const ioffset = page === 1 ? 1 : (perPage * (page - 1)) + 1
	let firmmembers = rank !== "all" ? firmmems.filter(mem => typeof rank === "object" && rank[mem.firm_role] || rank === "traders" && mem.firm_role === "" || mem.firm_role === rank && rank !== "traders") : firmmems
	const pages = Math.ceil(firmmems.length / perPage)
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
		assoc: "Associate",
		exec: "Executive",
		coo: "COO",
		cfo: "CFO",
		ceo: "CEO"
	}

	let firmimage = false
	client.guilds.get("563439683309142016").emojis.forEach(async (e) => {
		if (e.name === firm.name.toLowerCase().replace(/ /g, "")) firmimage = e.url
	})

	if (!firmimage) firmimage = "https://cdn.discordapp.com/emojis/588029928063107230.png"

	const stats = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter(`Page ${page} of ${pages} | Made by Thomas van Tilburg and Keanu73 with ❤️`, "https://i.imgur.com/1t8gmE7.png")
		.setTitle(`${modifiers[modifierarg] === "best" ? "Top" : "Bottom"} ${rank === "all" ? "Investors" : firmranks[rankarg]} of ${firm.name}`)
		.setURL("https://meme.market/leaderboards.html?season=1")
		.setThumbnail(firmimage)

	await firmmembers
	for (let i = 0; i < firmmembers.length; i++) {
		const investor = firmmembers[i]
		const lastinvested = investor.timediff !== "Never" ? moment.duration(investor.timediff, "seconds").format("[**]Y[**] [year], [**]D[**] [day], [**]H[**] [hour] [and] [**]m[**] [minutes] [ago]") : "Never"
		const ifirmrole = investor.firm_role === "" ? "Floor Trader" : firmroles[investor.firm_role]
		stats.addField(`\`${i + ioffset}.\` u/${investor.name} - ${ifirmrole}`, `
\`Net worth:\` **${client.api.getSuffix(investor.networth)} M¢**
\`Contribution to firm since payout:\` **${client.api.numberWithCommas(investor.contribution)} M¢**
\`Contribution / estimated payout:\` **${investor.difference.toFixed(2)}**%
\`Average investments per day:\` **${investor.avginvestments}**
\`Completed investments:\` **${investor.completed}**
\`Last invested:\` ${lastinvested}`, false)
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
	description: "Shows you the top members of your firm sorted by arguments. (networth == sorted by networth, activity == sorted by last invested at, contribution === sorted by firm contribution, investments === sorted by average investments.",
	usage: "leaderboard [all, traders, assocs, execs, board] [best, worst] [networth, activity, contribution, investments] [page]"
}