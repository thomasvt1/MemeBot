const { RichEmbed } = require("discord.js")
const moment = require("moment")
exports.run = (client, message, [name], _level) => {
	const check = client.api.getLink(message.author.id)
	let user

	if (name.length < 3 && !check) {
		message.reply(":thinking: Something tells me that is not a Reddit username")
	}

	client.api.getInvestorProfile(check ? check : name).then(body => {
		if (body.id === 0) return message.reply(":question: I couldn't find that user. Sorry")
		if (body.name === name.toLowerCase() || body.name === check.toLowerCase()) user = body
	})
	
	const history = client.api.getInvestorHistory(check ? check : name.toLowerCase())

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

	// Calculate this week's profit using 
	// hacky ternary operators to keep it clean
	let weekprofit
	for (let i = !history[0].done ? 0 : 1; !history[0].done ? i < 6 : i < 7; i++) {
		weekprofit += history[i].profit
	}

	// Calculate amount of investments today
	let investments_today = 0
	for (const inv of history) {
		const timediff = Math.trunc(((new Date().getTime() / 1000) - inv.time) / 36e2) // 36e3 will result in hours between date objects
		if (timediff > 24)
			break
		investments_today++
	}
	
	const weekratio = (weekprofit / user.networth).toFixed(3)
	const weekratioscore = (weekratio < 1) ? "Poor" : (weekratio > 1) ? "Good" : (weekratio > 1.5) ? "Excellent" : (weekratio > 2) ? "Outstanding" : false
	const lastinvested = Math.trunc(((new Date().getTime() / 1000) - history[0].time) / 36e2) // 36e3 will result in hours between date objects
	const maturesin = (history[0].time + 14400) - Math.trunc(new Date().getTime() / 1000) // 14400 = 4 hours
	const currentinvestment = history.length && !history[0].done ? client.api.getSubmission(history[0].post) : false // Simple ternary to check whether current investment is running
	const investment_return = client.math.calculateInvestmentReturn(history[0].upvotes, currentinvestment.score, user.networth) // Fancy math to calculate investment return
	const score = currentinvestment.score // I'm lazy xd
	const break_even = Math.round(client.math.calculateBreakEvenPoint(history[0].upvotes))
	const stats = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeCord")
		.setColor("GOLD")
		.setFooter("Made by Thomas van Tilburg with ❤️", client.users.get(client.config.ownerID).avatarURL)
		.setTitle(`u/${check ? check : name}`)
		.setURL(`https://reddit.com/u/${check ? check : name}`)
		.addField("**Net worth**", `${client.api.numberWithCommas(user.networth)} M¢`, true)
		.addField("**Average investment profit**", `${profitprct.toFixed(2)}%`, true)
		.addField("**Average investment profit (last 5)**", `${profitprct_5.toFixed(2)}%`, true)
		.addField("**Investments last 24 hours**", `${investments_today}`, true)
		.addField("**Last invested**", `${lastinvested} hours ago`, true)
		.addField("**This week's profit**", `${client.api.numberWithCommas(user.networth - weekprofit)} M¢`, true)
		.addField("**Week profit ratio**", `${!weekratioscore ? "Unknown" : weekratioscore} (${weekratio})`, true)
		
	if (currentinvestment) stats.addField("Current investment", `
		__**[${currentinvestment.title}](https://redd.it/${history[0].post})**__\n\n
		**Initial upvotes:** ${history[0].upvotes}\n
		**Current upvotes:** ${score}\n
		**Matures in:** ${moment(maturesin).format("HH hours mm mins")}\n
		**Invested:** ${client.api.numberWithCommas(history[0].amount)} M¢\n
		**Profit:** ${client.api.numberWithCommas(Math.trunc(investment_return / 100 * history[0].amount))} M¢ (*${investment_return}%*)\n
		**Breaks even at:** ${break_even} upvotes (${break_even - score} upvotes to go) M¢`, true)
	if (check) stats.setThumbnail(client.users.get(message.author.id).displayAvatarURL)
	if (!check && client.api.getRedditLink(name)) stats.setThumbnail(client.users.get(client.api.getRedditLink(name)))
	if (currentinvestment) stats.setImage(currentinvestment.url)
	message.channel.send({ embed: stats })
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
