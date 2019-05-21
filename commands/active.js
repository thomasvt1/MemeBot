const { RichEmbed } = require("discord.js")
const moment = require("moment")
exports.run = async (client, message, [name], _level) => {
	name = name.replace(/^((\/|)u\/)/g, "")
	
	const check = await client.api.getLink(message.author.id)
	const username = check ? check : name.replace(/^((\/|)u\/)/g, "")

	if (!name && !check) return message.reply(":question: Please supply a Reddit username.")

	if (name.length < 3 && !check) return message.reply(":thinking: Something tells me that is not a Reddit username")

	const user = await client.api.getInvestorProfile(username).catch(err => client.logger.error(err.stack))
	if (user.id === 0) return message.reply(":question: I couldn't find that user. Sorry")

	const firm = await client.api.getFirmProfile(user.firm).catch(err => client.logger.error(err.stack))

	const redditlink = await client.api.getRedditLink(username.toLowerCase())

	const history = await client.api.getInvestorHistory(username.toLowerCase()).catch(err => console.error(err))

	if (!history.length) return message.reply(":exclamation: You haven't invested before!")

	// Calculate profit %
	let profitprct = 0
	for (let i = 0; i < history.length; i++) {
		if (history[i].done === true) {
			profitprct += history[i].profit / history[i].amount * 100
		}
	}

	profitprct /= history.length // Calculate average % return


	// Calculate amount of investments today
	let investments_today = 0
	for (const inv of history) {
		const timediff = Math.trunc(((new Date().getTime() / 1000) - inv.time) / 36e2) // 36e3 will result in hours between date objects
		if (timediff > 24)
			break
		investments_today++
	}

	let currentpost
	let lastpost

	const currentinvestment = !history[0].done ? history[0] : false // Simple ternary to check whether current investment is running
	const lastinvestment = history[0].done ? history[0] : history[1]

	await client.api.r.getSubmission(lastinvestment.post).fetch().then((sub) => lastpost = sub).catch(err => console.error(err))
	currentinvestment ? await client.api.r.getSubmission(currentinvestment.post).fetch().then((sub) => currentpost = sub).catch(err => console.error(err)) : currentpost = false

	// Last investment's return
	const lastinvestment_return = client.math.calculateInvestmentReturn(lastinvestment.upvotes, lastpost.score, user.networth)
	// Fancy math to calculate investment return
	const investment_return = currentinvestment ? client.math.calculateInvestmentReturn(currentinvestment.upvotes, currentpost.score, user.networth) : false

	const lastprofit = user.firm !== 0 ? lastinvestment.profit - lastinvestment.profit * (firm.tax / 100) : lastinvestment.profit
	let forecastedprofit = Math.trunc(investment_return / 100 * currentinvestment.amount)
	user.firm !== 0 ? forecastedprofit -= forecastedprofit * (firm.tax / 100) : forecastedprofit

	const lastinvested = Math.trunc(((moment().unix()) - (!currentinvestment ? lastinvestment.time : currentinvestment.time)) / 36e2) // 36e3 will result in hours between date objects
	const maturesin = currentinvestment ? (currentinvestment.time + 14400) - moment().unix() : false // 14400 = 4 hours
	const hours = currentinvestment ? Math.trunc(maturesin / 60 / 60) : false
	const minutes = currentinvestment ? Math.trunc(((maturesin / 3600) - hours) * 60) : false
	const maturedat = moment.unix(lastinvestment.time + 14400).format("ddd Do MMM YYYY [at] HH:mm [UTC]ZZ") // 14400 = 4 hours

	const break_even = currentinvestment ? Math.round(client.math.calculateBreakEvenPoint(currentinvestment.upvotes)) : false
	const broke_even = Math.round(client.math.calculateBreakEvenPoint(lastinvestment.upvotes))
	const breaks = currentinvestment ? ((break_even - currentpost.score) < 0 ? "Broke" : "Breaks") : false
	const breaktogo = currentinvestment ? ((break_even - currentpost.score) < 0 ? "" : `(${break_even - currentpost.score} upvotes to go)`) : false

	const stats = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter("Made by Thomas van Tilburg with ❤️", client.users.get(client.config.ownerID).avatarURL)
		.setTitle(`u/${username}`)
		.setURL(`https://reddit.com/u/${username}`)
		.addField("**Net worth**", `${client.api.numberWithCommas(user.networth)} M¢`, false)
		.addField("**Average investment profit**", `${profitprct.toFixed(2)}%`, false)
		.addField("**Investments last 24 hours**", `${investments_today}`, false)
		.addField("**Last invested**", `${lastinvested} hours ago`, false)

	if (currentinvestment) {
		stats.addField("Current investment", `
[u/${currentpost.author.name}](https://reddit.com/u/${currentpost.author.name})\n
__**[${currentpost.title}](https://redd.it/${currentinvestment.post})**__\n
**Initial upvotes:** ${currentinvestment.upvotes}\n
**Current upvotes:** ${currentpost.score}\n
**Matures in:** ${hours} hours ${String(minutes).padStart(2, "0")} minutes\n
**Invested:** ${client.api.numberWithCommas(currentinvestment.amount)} M¢\n
**Profit:** ${client.api.numberWithCommas(forecastedprofit)} M¢ (*${investment_return}%*)\n
**${breaks} even at:** ${break_even} upvotes ${breaktogo}`, true)
		stats.addBlankField(false)
	}
	stats.addField("Last investment", `
[u/${lastpost.author.name}](https://reddit.com/u/${lastpost.author.name})\n
__**[${lastpost.title}](https://redd.it/${lastinvestment.post})**__\n
**Initial upvotes:** ${lastinvestment.upvotes}\n
**Final upvotes:** ${lastinvestment.final_upvotes}\n
**Matured at:** ${maturedat}\n
**Invested:** ${client.api.numberWithCommas(lastinvestment.amount)} M¢\n
**Profit:** ${client.api.numberWithCommas(lastprofit)} M¢ (*${lastinvestment_return}%*)\n
**Broke even at:** ${broke_even} upvotes`, true)
	if (check) stats.setThumbnail(client.users.get(message.author.id).displayAvatarURL)
	if (!check && redditlink) stats.setThumbnail(client.users.get(redditlink).displayAvatarURL)
	if (lastinvestment && currentinvestment || lastinvestment && !currentinvestment) stats.setImage(lastpost.thumbnail)
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
