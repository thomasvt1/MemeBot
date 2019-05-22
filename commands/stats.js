const { RichEmbed } = require("discord.js")
const moment = require("moment")
exports.run = async (client, message, [name], _level) => {
	const check = await client.api.getLink(message.author.id)

	if (!name && !check) return message.reply(":question: Please supply a Reddit username.")

	if (name.length < 3 && !check) return message.reply(":thinking: Something tells me that is not a Reddit username")

	name = name.replace(/^((\/|)u\/)/g, "")
	const username = check ? check : name

	const user = await client.api.getInvestorProfile(username).catch(err => client.logger.error(err.stack))
	if (user.id === 0) return message.reply(":question: I couldn't find that user.")

	const firm = await client.api.getFirmProfile(user.firm).catch(err => client.logger.error(err.stack))

	const redditlink = await client.api.getRedditLink(username.toLowerCase())
	
	const history = await client.api.getInvestorHistory(username).catch(err => client.logger.error(err.stack))

	// Calculate profit %
	let profitprct = 0
	let profitprct_5 = 0
	for (let i = 0; i < history.length; i++) {
		if (history[i].done === true) {
			profitprct += history[i].profit / history[i].amount * 100

			if (i <= 5) { // Use for average last 5
				profitprct_5 += history[i].profit / history[i].amount * 100
			}
		}
	}

	profitprct /= history.length // Calculate average % return
	profitprct_5 /= 5 // Calculate average % return for last 5

	// Calculate this week's profit
	let weekprofit = 0
	let i = 0
	while (i < history.length && before_last_payout(history[i].time)) {
		weekprofit += history[i].profit
		i++
	}
	
	// Calculate amount of investments today
	let investments_today = 0
	for (const inv of history) {
		const timediff = Math.trunc(((new Date().getTime() / 1000) - inv.time) / 36e2) // 36e3 will result in hours between date objects
		if (timediff > 24)
			break
		investments_today++
	}
	
	let currentpost
	await client.api.r.getSubmission(history[0].post).fetch().then((sub) => currentpost = sub).catch(err => console.error(err))
	// Removing week ratio scores for now until we have sufficient data on what is a good ratio
	// const weekratioscore = (weekratio < 1) ? "Poor" : (weekratio > 1) ? "Good" : (weekratio > 1.5) ? "Excellent" : (weekratio > 2) ? "Outstanding" : false
	const weekratio = ((weekprofit / (user.networth - weekprofit)) * 100.0).toFixed(2)
	//const weekratio = ((weekprofit / (user.networth - weekprofit)) * 100.0).toFixed(2)

	const currentinvestment = history.length && !history[0].done ? history[0] : false // Simple ternary to check whether current investment is running
	const investment_return = client.math.calculateInvestmentReturn(currentinvestment.upvotes, currentpost.score, user.networth) // Fancy math to calculate investment return
	let forecastedprofit = Math.trunc(investment_return / 100 * currentinvestment.amount)
	user.firm !== 0 ? forecastedprofit -= forecastedprofit * (firm.tax / 100) : forecastedprofit

	const lastinvested = Math.trunc(((moment().unix()) - history[0].time) / 36e2) // 36e3 will result in hours between date objects
	const maturesin = (currentinvestment.time + 14400) - moment().unix() // 14400 = 4 hours
	const hours = Math.trunc(maturesin / 60 / 60)
	const minutes = Math.trunc(((maturesin / 3600) - hours) * 60)
	const break_even = Math.round(client.math.calculateBreakEvenPoint(currentinvestment.upvotes))
	const breaks = (break_even - currentpost.score) < 0 ? "Broke" : "Breaks"
	const breaktogo = (break_even - currentpost.score) < 0 ? "" : `(${break_even - currentpost.score} upvotes to go)`
	const stats = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter("Made by Thomas van Tilburg with ❤️", client.users.get(client.config.ownerID).avatarURL)
		.setTitle(`u/${username}`)
		.setURL(`https://reddit.com/u/${username}`)
		.addField("**Net worth**", `${client.api.numberWithCommas(user.networth)} M¢`, true)
		.addField("**Average investment profit**", `${profitprct.toFixed(2)}%`, true)
		.addField("**Average investment profit (last 5)**", `${profitprct_5.toFixed(2)}%`, true)
		.addField("**Investments last 24 hours**", `${investments_today}`, true)
		.addField("**Last invested**", `${lastinvested} hours ago`, true)
		.addField("**This week's profit**", `${client.api.numberWithCommas(weekprofit)} M¢`, true)
		.addField("**Week profit ratio**", `${weekratio}%`, true)
		
	if (currentinvestment) stats.addField("Current investment", `
[u/${currentpost.author.name}](https://reddit.com/u/${currentpost.author.name})
__**[${currentpost.title}](https://redd.it/${currentinvestment.post})**__\n
**Initial upvotes:** ${history[0].upvotes}\n
**Current upvotes:** ${currentpost.score}\n
**Matures in:** ${hours} hours ${String(minutes).padStart(2, "0")} minutes\n
**Invested:** ${client.api.numberWithCommas(currentinvestment.amount)} M¢\n
**Profit:** ${client.api.numberWithCommas(Math.trunc(forecastedprofit))} M¢ (*${investment_return}%*)\n
**${breaks} even at:** ${break_even} upvotes ${breaktogo}`, true)
	if (check) stats.setThumbnail(client.users.get(message.author.id).displayAvatarURL)
	if (!check && redditlink) stats.setThumbnail(client.users.get(redditlink).displayAvatarURl)
	if (currentinvestment) stats.setImage(currentpost.thumbnail)
	return message.channel.send({ embed: stats })
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [],
	permLevel: "User"
}

exports.help = {
	name: "stats",
	category: "MemeEconomy",
	description: "Checks yours or someone else's stats",
	usage: "stats <reddit username> (uses set default)"
}

function before_last_payout(inv_time) {
	return !((new Date(inv_time * 1000).getDay() === 5 && moment(inv_time).hour() < 23))
}