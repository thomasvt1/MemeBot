/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* All rights reserved.
*/
const { RichEmbed } = require("discord.js")
const moment = require("moment")
require("moment-duration-format")
exports.run = async (client, message, _args, [user, history, firm, isusername], _level) => {
	if (!history || !history.length) return message.channel.send(`:exclamation: ${isusername ? "They" : "You"} haven't invested before!`)

	const currentinvestment = !history[0].done ? history[0] : false // Simple ternary to check whether current investment is running

	if (!currentinvestment) return message.channel.send(`:exclamation: ${isusername ? "They" : "You"} last invested ${moment.duration(moment().unix() - history[0].time, "seconds").format("[**]Y[**] [year], [**]D[**] [day], [**]H[**] [hour] [and] [**]m[**] [minutes] [ago]")}`)

	const currentpost = currentinvestment ? await client.api.r.getSubmission(currentinvestment.post).fetch().then((sub) => sub).catch(err => client.logger.error(err.stack)) : false

	// Fancy math to calculate investment return
	// using sigmoids
	let factor
	let factor_max
	if (currentinvestment) {
		const array = await client.math.calculate_factor(currentinvestment.upvotes, currentpost.score, user.networth)
		factor = array[0]
		factor_max = array[1]
	}

	// Include firm tax for a more accurate number..
	let forecastedprofit = currentinvestment.amount * factor / 100
	if (user.firm !== 0) forecastedprofit -= forecastedprofit * (firm.tax / 100)

	let maxprofit = currentinvestment.amount * factor_max / 100
	if (user.firm !== 0) maxprofit -= maxprofit * (firm.tax / 100)

	const investedat = moment.unix(currentinvestment.time).format("ddd Do MMM YYYY [at] HH:mm [UTC]ZZ")
	const maturesin = currentinvestment ? moment.duration((currentinvestment.time + 14400) - moment().unix(), "seconds").format("[**]H[**] [hour] [and] [**]m[**] [minute]") : false // 14400 = 4 hours

	const breakeven_point = Math.round(client.math.calculateBreakEvenPoint(currentinvestment.upvotes))
	const breaktogo = (breakeven_point - currentpost.score) < 0 ? "" : `(${breakeven_point - currentpost.score} upvotes to go)`

	let text_upvotes = `**Initial upvotes:** ${currentinvestment.upvotes}\n`
	text_upvotes += `**Current upvotes:** ${currentpost.score}\n`
	text_upvotes += `**${currentpost.score > breakeven_point ? "Broke" : "Breaks"} even at:** ${breakeven_point} upvotes ${breaktogo}\u200b`

	let text_profit = `**Invested:** ${client.api.numberWithCommas(currentinvestment.amount)} M¢\n`
	text_profit += `**Current profit:** ${client.api.numberWithCommas(Math.trunc(forecastedprofit))} M¢ (*${factor.toFixed(2)}%*)\n`
	text_profit += `**Maximum profit:** ${client.api.numberWithCommas(Math.trunc(maxprofit))} M¢ (*${factor_max.toFixed(2)}%*)`

	const investments = await client.api.getInvestments(await currentpost.comments.fetchAll())

	const discord_id = await client.api.getRedditLink(client, currentpost.author.name)
	const pfp = client.users.get(discord_id) ? client.users.get(discord_id).displayAvatarURL : await client.api.r.getUser(currentpost.author.name).fetch().then((usr) => usr.icon_img).catch(err => client.logger.error(err.stack))

	const opfirmid = await client.api.getInvestorProfile(currentpost.author.name).then(investor => investor.firm).catch(err => {
		if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
		client.logger.error(err.stack)
	})
	const opfirm = opfirmid !== 0 ? await client.api.getFirmProfile(opfirmid).then(firm => firm.name).catch(err => {
		if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
		client.logger.error(err.stack)
	}) : false

	const opfirmemoji = opfirm ? client.firmEmoji(opfirm) : ""

	const stats = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter("Made by Thomas van Tilburg and Keanu73 with ❤️", "https://i.imgur.com/1t8gmE7.png")
		.setURL(`https://meme.market/user.html?account=${user.name}`)
		.setImage(currentpost.thumbnail)
		.setThumbnail(pfp)
		.addField("Current investment", `[u/${currentpost.author.name}](https://reddit.com/u/${currentpost.author.name}) ${opfirmemoji}\n**__[${currentpost.title}](https://redd.it/${currentinvestment.post})__**\n\n**Invested at:** ${investedat}\n**Matures in:** ${maturesin}\n**Amount of investments:** ${investments}\n\u200b`)
		.addField("Upvotes", text_upvotes)
		.addField("Profit", text_profit)
	return message.channel.send({ embed: stats })
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [],
	permLevel: "User",
	info: ["user", "history", "firm", "isusername"]
}

exports.help = {
	name: "active",
	category: "MemeEconomy",
	description: "Returns your current active investment, and compares it with your previous investment",
	usage: "active <reddit username> (uses set default)"
}
