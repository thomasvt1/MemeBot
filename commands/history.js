/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* All rights reserved.
*/

const { RichEmbed } = require("discord.js")
const moment = require("moment")
exports.run = async (client, message, args, [user, discord_id, firm], _level) => {
	let investment = args[0]

	if (investment === undefined) return message.channel.send(":exclamation: You haven't specified how many investments to go back!")

	if (isNaN(investment)) return message.channel.send(":thinking: Is this a real number?")

	investment = parseInt(investment)
	
	// Promise hacks...
	const promises = []
	let history = []
	let num_left = investment + 2
	let page = 0
	let amount = 0

	while (num_left > 0) {
		if (num_left > 100) {
			amount = 100
		} else {
			amount = num_left
		}
		promises.push(client.api.getInvestorHistory(user.name, amount, page).then(h => history = history.concat(h)).catch(err => {
			if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
			client.logger.error(err.stack)
		}))
		num_left -= amount
		if (num_left > 0) page += 1
	}

	await Promise.all(promises)

	if (!history || !history.length) return message.channel.send(":exclamation: You haven't invested before!")

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


	// Calculate amount of investments then
	let investments_on_day = 0
	for (let i = 0; i < history.length; i++) {
		const timediff = Math.trunc((history[investment - 1].time - history[i].time) / 36e2) // 36e3 will result in hours between date objects
		if (timediff > 24)
			break
		investments_on_day++
	}

	if (!history[investment]) return message.channel.send(":exclamation: You specified an investment past your time!")

	// Here we use some hacky logic to make sure
	// we are looking at PAST investments and not current ones.
	const lastinvestment = history[!history[investment - 1].done ? investment : investment - 1]

	const lastpost = await client.api.r.getSubmission(lastinvestment.post).fetch().then((sub) => sub).catch(err => client.logger.error(err.stack))

	// Calculate investment return..
	const [factor] = await client.math.calculate_factor(lastinvestment.upvotes, lastinvestment.final_upvotes, user.networth)

	const lastprofit = user.firm !== 0 ? Math.trunc(lastinvestment.profit - lastinvestment.profit * (firm.tax / 100)) : lastinvestment.profit

	const lastinvested = moment.duration(lastinvestment.time - history[parseInt(investment) + 1].time, "seconds").format("[**]Y[**] [year], [**]D[**] [day], [**]H[**] [hour] [and] [**]m[**] [minutes] [ago]") // 36e3 will result in hours between date objects
	const investedat = moment.unix(lastinvestment.time).format("ddd Do MMM YYYY [at] HH:mm [UTC]ZZ")
	const maturedat = moment.unix(lastinvestment.time + 14400).format("ddd Do MMM YYYY [at] HH:mm [UTC]ZZ") // 14400 = 4 hours

	const investments = await client.api.getInvestments(await lastpost.comments.fetchAll()).catch(err => client.logger.error(err.stack))

	const broke_even = Math.round(client.math.calculateBreakEvenPoint(lastinvestment.upvotes))
	const redditpfp = await client.api.r.getUser(user.name).fetch().then((usr) => usr.icon_img).catch(err => client.logger.error(err.stack))

	let text_upvotes = `**Initial upvotes:** ${lastinvestment.upvotes}\n`
	text_upvotes += `**Final upvotes:** ${lastinvestment.final_upvotes}\n`
	text_upvotes += `**Broke even at:** ${broke_even} upvotes\u200b`

	let text_profit = `**Invested:** ${client.api.numberWithCommas(lastinvestment.amount)} M¢\n`
	text_profit += `**Profit:** ${client.api.numberWithCommas(Math.trunc(lastprofit))} M¢ (*${factor.toFixed(2)}%*)`

	const opfirmid = await client.api.getInvestorProfile(lastpost.author.name).then(investor => investor.firm).catch(err => {
		if (err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
		client.logger.error(err.stack)
	})
	const opfirm = opfirmid !== 0 ? await client.api.getFirmProfile(opfirmid).then(firm => firm.name).catch(err => {
		if (err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
		client.logger.error(err.stack)
	}) : false

	const opfirmemoji = client.firmEmoji(opfirm)

	const stats = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter(`${investment} investment${investment === 1 ? "" : "s"} ago | Made by Thomas van Tilburg and Keanu73 with ❤️`, "https://i.imgur.com/1t8gmE7.png")
		.setTitle(`u/${user.name}`)
		.setURL(`https://meme.market/user.html?account=${user.name}`)
		.addField("Completed investments", user.completed - investment, false)
		.addField("Average investment profit", `${profitprct.toFixed(2)}%`, false)
		.addField("Investments on the day", `${investments_on_day}`, false)
		.addField("Last invested", lastinvested, false)
		.addField("Last investment", `[u/${lastpost.author.name}](https://reddit.com/u/${lastpost.author.name}) ${opfirmemoji}\n__**[${lastpost.title}](https://redd.it/${lastinvestment.post})**__\n\n**Invested at:** ${investedat}\n**Matured at:** ${maturedat}\n**Amount of investments:** ${investments}\n\u200b`, true)
		.addField("Upvotes", text_upvotes)
		.addField("Profit", text_profit)
		.setImage(lastpost.url)
	if (discord_id) stats.setThumbnail(client.users.get(discord_id).displayAvatarURL)
	if (!discord_id) stats.setThumbnail(redditpfp)
	return message.channel.send({ embed: stats })
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [],
	permLevel: "User",
	info: ["user", "discord_id", "firm"]
}

exports.help = {
	name: "history",
	category: "MemeEconomy",
	description: "Goes back however many investments and displays statistics",
	usage: "history <reddit username> <number of investments back> (uses set default)"
}
