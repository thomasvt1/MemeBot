const { RichEmbed } = require("discord.js")
const moment = require("moment")
exports.run = async (client, message, [username, redditlink, user, history, firm, _firmmembers, firmrole, check], _level) => {

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
	while (i < history.length && history[i].time > firm.last_payout) {
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
	
	const currentpost = await client.api.r.getSubmission(history[0].post).fetch().then((sub) => sub).catch(err => console.error(err))
	const weekratio = ((weekprofit / (user.networth - weekprofit)) * 100.0).toFixed(2)

	const currentinvestment = history.length && !history[0].done ? history[0] : false // Simple ternary to check whether current investment is running
	const roi = currentinvestment ? client.math.calculateInvestmentReturn(currentinvestment.upvotes, currentpost.score, user.networth) : false
	const investment_return = currentinvestment ? roi.investmentreturn : false
	const maxprofit = currentinvestment ? roi.maxprofit : false
	const maxpercent = currentinvestment ? roi.maxpercent : false
	let forecastedprofit = Math.trunc(investment_return / 100 * currentinvestment.amount)
	user.firm !== 0 ? forecastedprofit -= forecastedprofit * (firm.tax / 100) : forecastedprofit

	const lastinvested = moment.duration(moment().unix() - history[0].time, "seconds").format("[**]Y[**] [year], [**]D[**] [day], [**]H[**] [hour] [and] [**]m[**] [minutes] [ago]") // 36e3 will result in hours between date objects
	const maturesin = moment.duration((currentinvestment.time + 14400) - moment().unix(), "seconds").format("[**]H[**] [hour] [and] [**]m[**] [minute]") // 14400 = 4 hours
	
	const break_even = Math.round(client.math.calculateBreakEvenPoint(currentinvestment.upvotes))
	const breaks = (break_even - currentpost.score) < 0 ? "Broke" : "Breaks"
	const breaktogo = (break_even - currentpost.score) < 0 ? "" : `(${break_even - currentpost.score} upvotes to go)`
	const redditpfp = await client.api.r.getUser(username).fetch().then((usr) => usr.icon_img)

	const stats = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter("Made by Thomas van Tilburg and Keanu73 with ❤️", "https://i.imgur.com/1t8gmE7.png")
		.setTitle(`u/${username}`)
		.setURL(`https://meme.market/user.html?account=${username}`)
		.addField("**Net worth**", `${client.api.numberWithCommas(user.networth)} M¢`, true)
		.addField("**Completed investments**", `${client.api.numberWithCommas(user.completed)}`, true)
		.addField("**Rank**", `**\`#${user.rank}\`**`, true)
		.addField("**Firm**", `**\`${firmrole}\`** of **\`${firm.name}\`**`, true)
		.addField("**Average investment profit**", `${profitprct.toFixed(2)}%`, true)
		.addField("**Average investment profit (last 5)**", `${profitprct_5.toFixed(2)}%`, true)
		.addField("**Investments in the past day**", `${investments_today}`, true)
		.addField("**Last invested**", `${lastinvested}`, true)
		.addField("**This week's profit**", `${client.api.numberWithCommas(weekprofit)} M¢`, true)
		.addField("**Week profit ratio**", `${weekratio}%`, true)
		
	if (currentinvestment) stats.addField("Current investment", `
[u/${currentpost.author.name}](https://reddit.com/u/${currentpost.author.name})
__**[${currentpost.title}](https://redd.it/${currentinvestment.post})**__\n
**Initial upvotes:** ${history[0].upvotes}\n
**Current upvotes:** ${currentpost.score}\n
**Matures in:** ${maturesin}\n
**Invested:** ${client.api.numberWithCommas(currentinvestment.amount)} M¢\n
**Profit:** ${client.api.numberWithCommas(Math.trunc(forecastedprofit))} M¢ (*${investment_return}%*)\n
**Maximum profit:** ${client.api.numberWithCommas(Math.trunc(maxprofit))} M¢ (*${maxpercent}*)\n
**${breaks} even at:** ${break_even} upvotes ${breaktogo}`, true)
	if (!redditlink && check) stats.setThumbnail(client.users.get(message.author.id).displayAvatarURL)
	if (redditlink) stats.setThumbnail(client.users.get(redditlink).displayAvatarURL)
	if (!redditlink && !check) stats.setThumbnail(redditpfp)
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