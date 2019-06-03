const { RichEmbed } = require("discord.js")
const moment = require("moment")
exports.run = async (client, message, [username, redditlink, user, history, firm, _firmmembers, _firmrole, check, investment], _level) => {
	if (!history.length) return message.channel.send(":exclamation: You haven't invested before!")

	// Calculate profit %
	let profitprct = 0
	for (let i = (history.length - 1) - investment; i < history.length; i++) {
		if (history[i].done === true) {
			profitprct += history[i].profit / history[i].amount * 100
		}
	}

	profitprct /= history.length // Calculate average % return


	// Calculate amount of investments today
	let investments_on_day = 0
	for (let i = (history.length - 1) - investment; i < history.length; i++) {
		const timediff = Math.trunc((history[(history.length - 1) - investment].time - history[i].time) / 36e2) // 36e3 will result in hours between date objects
		if (timediff > 24)
			break
		investments_on_day++
	}
    
	if (!parseInt(investment)) return message.channel.send(":thinking: Is this a real number?")

	if (!history[investment]) return message.channel.send(":exclamation: You specified an investment past your time!")

	const lastinvestment = history[(history.length - 1) - investment]

	const lastpost = await client.api.r.getSubmission(lastinvestment.post).fetch().then((sub) => sub).catch(err => console.error(err))

	// Last investment's return
	const lastinvestment_return = client.math.calculateInvestmentReturn(lastinvestment.upvotes, lastpost.score, user.networth)

	const lastprofit = user.firm !== 0 ? Math.trunc(lastinvestment.profit - lastinvestment.profit * (firm.tax / 100)) : lastinvestment.profit

	const lastinvested = moment.duration(lastinvestment.time - history[(history.length - 1) - investment + 1].time, "seconds").format("[**]Y[**] [year], [**]D[**] [day], [**]H[**] [hour] [and] [**]m[**] [minutes] [ago]") // 36e3 will result in hours between date objects
	const maturedat = moment.unix(lastinvestment.time + 14400).format("ddd Do MMM YYYY [at] HH:mm [UTC]ZZ") // 14400 = 4 hours
    
	const broke_even = Math.round(client.math.calculateBreakEvenPoint(lastinvestment.upvotes))
	const redditpfp = await client.api.r.getUser(username).fetch().then((usr) => usr.icon_img)

	const stats = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter(`${investment} investment${investment == 1 ? "" : "s"} ago | Made by Thomas van Tilburg and Keanu73 with ❤️`, "https://i.imgur.com/1t8gmE7.png")
		.setTitle(`u/${username}`)
		.setURL(`https://meme.market/user.html?account=${username}`)
		.addField("Completed investments", user.completed - investment, false)
		.addField("Average investment profit", `${profitprct.toFixed(2)}%`, false)
		.addField("Investments on the day", `${investments_on_day}`, false)
		.addField("Last invested before", lastinvested, false)
		.addField("Last investment", `
[u/${lastpost.author.name}](https://reddit.com/u/${lastpost.author.name})\n
__**[${lastpost.title}](https://redd.it/${lastinvestment.post})**__\n
**Initial upvotes:** ${lastinvestment.upvotes}\n
**Final upvotes:** ${lastinvestment.final_upvotes}\n
**Matured at:** ${maturedat}\n
**Invested:** ${client.api.numberWithCommas(lastinvestment.amount)} M¢\n
**Profit:** ${client.api.numberWithCommas(lastprofit)} M¢ (*${lastinvestment_return}%*)\n
**Broke even at:** ${broke_even} upvotes`, true)
		.setImage(lastpost.thumbnail)
	if (check) stats.setThumbnail(client.users.get(message.author.id).displayAvatarURL)
	if (!check && redditlink) stats.setThumbnail(client.users.get(redditlink).displayAvatarURL)
	if (redditlink) stats.setThumbnail(client.users.get(redditlink).displayAvatarURL)
	if (!redditlink && !check) stats.setThumbnail(redditpfp)
	return message.channel.send({ embed: stats })
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [],
	permLevel: "User"
}

exports.help = {
	name: "history",
	category: "MemeEconomy",
	description: "Goes back however many investments and displays statistics",
	usage: "history <reddit username> <number of investments back> (uses set default)"
}
