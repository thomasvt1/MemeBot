const { RichEmbed } = require("discord.js")
const moment = require("moment")
exports.run = async (client, message, [username, redditlink, user, history, firm, _firmmembers, _firmrole, check], _level) => {
	if (!history || !history.length) return message.channel.send(":exclamation: You haven't invested before!")

	const currentinvestment = !history[0].done ? history[0] : false // Simple ternary to check whether current investment is running

	if (!currentinvestment) {
		return message.channel.send(":exclamation: You don't have an active investment")
	}

	const currentpost = currentinvestment ? await client.api.r.getSubmission(currentinvestment.post).fetch().then((sub) => sub).catch(err => console.error(err)) : false

	// Fancy math to calculate investment return
	const [factor, factor_max] = currentinvestment ? await client.math.calculate_factor(currentinvestment.upvotes, currentpost.score, user.networth) : false

	let forecastedprofit = currentinvestment.amount * factor
	if (user.firm !== 0) forecastedprofit -= forecastedprofit * (firm.tax / 100)

	let maxprofit = currentinvestment.amount * factor_max
	if (user.firm !== 0) maxprofit -= maxprofit * (firm.tax / 100)


	const maturesin = currentinvestment ? moment.duration((currentinvestment.time + 14400) - moment().unix(), "seconds").format("[**]H[**] [hour] [and] [**]m[**] [minute]") : false // 14400 = 4 hours

	const breakeven_point = Math.round(client.math.calculateBreakEvenPoint(currentinvestment.upvotes))

	let text_upvotes = `
	**Initial upvotes:** ${currentinvestment.upvotes}
	**Current upvotes:** ${currentpost.score}\n`

	if (breakeven_point >= currentinvestment.score)
		text_upvotes += `**Break even at:** ${breakeven_point}`

	text_upvotes += "\n\u200b"

	const text_profit = `
	**Invested:** ${client.api.numberWithCommas(currentinvestment.amount)} M¢
	**Forecasted profit:** ${client.api.numberWithCommas(Math.trunc(forecastedprofit))} M¢ (*${factor.toFixed(2)}%*)
	**Maximum profit:** ${client.api.numberWithCommas(Math.trunc(maxprofit))} M¢ (*${factor_max.toFixed(2)}%*)`

	const stats = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter("Made by Thomas van Tilburg and Keanu73 with ❤️", "https://i.imgur.com/1t8gmE7.png")
		.setTitle(`u/${username}`)
		.setURL(`https://meme.market/user.html?account=${username}`)
		.setThumbnail(currentpost.thumbnail)
		.addField("Current investment", `
		**[${currentpost.title}](https://redd.it/${currentinvestment.post})**\n
		**Matures in:** ${maturesin}\n\u200b`)
		.addField("Upvotes", text_upvotes)
		.addField("Profit", text_profit)

	return message.channel.send({ embed: stats })
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [],
	permLevel: "User"
}

exports.help = {
	name: "active",
	category: "MemeEconomy",
	description: "Returns your current active investment, and compares it with your previous investment",
	usage: "active <reddit username> (uses set default)"
}
