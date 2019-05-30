const { RichEmbed } = require("discord.js")
const moment = require("moment")
exports.run = async (client, message, [username, redditlink, user, history, firm, _firmmembers, _firmrole, check], _level) => {
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

	const currentinvestment = !history[0].done ? history[0] : false // Simple ternary to check whether current investment is running
	const lastinvestment = history[0].done ? history[0] : history[1]

	const lastpost = await client.api.r.getSubmission(lastinvestment.post).fetch().then((sub) => sub).catch(err => console.error(err))
	const currentpost = currentinvestment ? await client.api.r.getSubmission(currentinvestment.post).fetch().then((sub) => sub).catch(err => console.error(err)) : false

	// Last investment's return
	const lastinvestment_return = client.math.calculateInvestmentReturn(lastinvestment.upvotes, lastpost.score, user.networth)
	// Fancy math to calculate investment return
	const investment_return = currentinvestment ? client.math.calculateInvestmentReturn(currentinvestment.upvotes, currentpost.score, user.networth) : false

	const lastprofit = user.firm !== 0 ? Math.trunc(lastinvestment.profit - lastinvestment.profit * (firm.tax / 100)) : lastinvestment.profit
	let forecastedprofit = Math.trunc(investment_return / 100 * currentinvestment.amount)
	user.firm !== 0 ? forecastedprofit -= forecastedprofit * (firm.tax / 100) : forecastedprofit

	const lastinvested = moment.duration(moment().unix() - (!currentinvestment ? lastinvestment.time : currentinvestment.time), "seconds").format("[**]Y[**] [year], [**]D[**] [day], [**]H[**] [hour] [and] [**]m[**] [minutes] [ago]") // 36e3 will result in hours between date objects
	const maturesin = currentinvestment ? moment.duration((currentinvestment.time + 14400) - moment().unix(), "seconds").format("[**]H[**] [hour] [and] [**]m[**] [minute]") : false // 14400 = 4 hours
	const maturedat = moment.unix(lastinvestment.time + 14400).format("ddd Do MMM YYYY [at] HH:mm [UTC]ZZ") // 14400 = 4 hours

	const break_even = currentinvestment ? Math.round(client.math.calculateBreakEvenPoint(currentinvestment.upvotes)) : false
	const broke_even = Math.round(client.math.calculateBreakEvenPoint(lastinvestment.upvotes))
	const breaks = currentinvestment ? ((break_even - currentpost.score) < 0 ? "Broke" : "Breaks") : false
	const breaktogo = currentinvestment ? ((break_even - currentpost.score) < 0 ? "" : `(${break_even - currentpost.score} upvotes to go)`) : false

	const stats = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter("Made by Thomas van Tilburg and Keanu73 with ❤️", "https://i.imgur.com/1t8gmE7.png")
		.setTitle(`u/${username}`)
		.setURL(`https://meme.market/user.html?account=${username}`)
		.addField("Net worth", `${client.api.numberWithCommas(user.networth)} M¢`, false)
		.addField("Average investment profit", `${profitprct.toFixed(2)}%`, false)
		.addField("Investments last 24 hours", `${investments_today}`, false)
		.addField("Last invested", lastinvested, false)

	if (currentinvestment) {
		stats.addField("Current investment", `
[u/${currentpost.author.name}](https://reddit.com/u/${currentpost.author.name})\n
__**[${currentpost.title}](https://redd.it/${currentinvestment.post})**__\n
**Initial upvotes:** ${currentinvestment.upvotes}\n
**Current upvotes:** ${currentpost.score}\n
**Matures in:** ${maturesin}\n
**Invested:** ${client.api.numberWithCommas(currentinvestment.amount)} M¢\n
**Forecasted profit:** ${client.api.numberWithCommas(Math.trunc(forecastedprofit))} M¢ (*${investment_return}%*)\n
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
