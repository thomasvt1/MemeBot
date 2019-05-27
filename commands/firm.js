const { RichEmbed } = require("discord.js")
const moment = require("moment")
const momentf = require("moment-duration-format")
exports.run = async (client, message, [name], _level) => {
	const check = await client.api.getLink(message.author.id)

	if (!name && !check) return message.reply(":question: Please supply a Reddit username.")

	if (name.length < 3 && !check) return message.reply(":thinking: Something tells me that is not a Reddit username")

	name = name.replace(/^((\/|)u\/)/g, "")
	const username = check ? check : name

	const user = await client.api.getInvestorProfile(username.toLowerCase()).catch(err => client.logger.error(err.stack))
	if (user.id === 0) return message.reply(":question: I couldn't find that user.")
	if (user.firm === 0 && !check) return message.reply(":x: This person isn't in a firm.")
	if (user.firm === 0 && check) return message.reply(":x: You're not in a firm.")

	const redditlink = await client.api.getRedditLink(username.toLowerCase())

	const firm = await client.api.getFirmProfile(user.firm).catch(err => client.logger.error(err.stack))
  
	const firmmembers = await client.api.getFirmMembers(user.firm).catch(err => client.logger.error(err.stack))
  
	const firmroles = {
		assoc: "Associate",
		exec: "Executive",
		coo: "COO",
		cfo: "CFO",
		ceo: "COO"
	}

	// Here we calculate the average investment profit of the entire firm
	// by listing out all of each firm member's investments, then pushing them
	// all into one array. We then average them all out.
	let investments = []
	let profitprct = 0

	for (let i = 0; i < firmmembers.length; i++) {
		let num_left = firmmembers[i].completed
		let page = 0
		let amount = 0

		while (num_left > 0) {
			if (num_left > 100) {
				amount = 100
			} else {
				amount = num_left
			}
			const history = await client.api.getInvestorHistory(firmmembers[i].name, amount, page)
			investments = investments.concat(history)
			num_left -= amount
			page += 1
		}
	}

	for (let i = 0; i < investments.length; i++) {
		if (investments[i].done === true) {
			profitprct += investments[i].profit / investments[i].amount * 100 // investor profit ratio
		}
	}

	profitprct /= investments.length // Calculate average % return

	// Calculate week's best profiteer, also include contribution to firm balance

	const weekprofiteers = []

	for (const member of firmmembers) {
		const history = await client.api.getInvestorHistory(member.name)
		let weekprofit = 0
		let i = 0
		while (i < history.length && before_last_payout(history[i].time)) {
			weekprofit += history[i].profit
			i++
		}

		weekprofiteers.push({ name: member.name, profit: weekprofit })
	}

	weekprofiteers.sort((a, b) => b.profit - a.profit)

	const weekbestprofiteer = weekprofiteers[0]
	const firmcontribution = weekbestprofiteer.profit - weekbestprofiteer.profit * (firm.tax / 100)
	const firmconstr = `\nContributed **${client.api.numberWithCommas(Math.trunc(firmcontribution))}** M¢ to firm (**${((firmcontribution / firm.balance) * 100).toFixed(2)}%**)`

	// Calculate most inactive investors and most active investors
	// (in terms of **time difference**, not investments.)
	// List all of them, calculate time difference, format it using moment-duration-format.

	const inactiveinvestors = []
	const activeinvestors = []

	for (const member of firmmembers) {
		const history = await client.api.getInvestorHistory(member.name, 1)
		if (history[0] !== undefined) {
			inactiveinvestors.push({ name: member.name, timediff: Math.trunc(new Date().getTime() / 1000) - history[0].time })
			activeinvestors.push({ name: member.name, timediff: Math.trunc(new Date().getTime() / 1000) - history[0].time })
		}
	}

	inactiveinvestors.sort((a, b) => b.timediff - a.timediff)
	activeinvestors.sort((a, b) => a.timediff - b.timediff)

	const mostinactiveinvestor = moment.duration(inactiveinvestors[0].timediff, "seconds").format("[**]Y[**] [year], [**]D[**] [day], [**]H[**] [hour] [and] [**]m[**] [minutes] [ago]")
	const lastinvestor = moment.duration(activeinvestors[0].timediff, "seconds").format("[**]Y[**] [year], [**]D[**] [day], [**]H[**] [hour] [and] [**]m[**] [minutes] [ago]")

	const firminfo = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter("Made by Thomas van Tilburg and Keanu73 with ❤️", "https://i.imgur.com/1t8gmE7.png")
		.setTitle(firm.name)
		.setURL(`https://meme.market/firm.html?firm=${user.firm}`)
		.addField("Balance", `${client.api.numberWithCommas(firm.balance)} M¢`, true)
		.addField("Average investment profit (firm)", `${profitprct.toFixed(3)}%`, true)
		.addField("Your Rank", user.firm_role === "" ? "Floor Trader": firmroles[user.firm_role], true)
		.addField("Last investor", `[u/${activeinvestors[0].name}](https://meme.market/user.html?account=${activeinvestors[0].name})\n${lastinvestor}`, true)
		.addField("Most inactive investor", `[u/${inactiveinvestors[0].name}](https://meme.market/user.html?account=${inactiveinvestors[0].name})\n${mostinactiveinvestor}`, true)
		.addField("Week's best profiteer", `[u/${weekbestprofiteer.name}](https://meme.market/user.html?account=${weekbestprofiteer.name})\n**${client.api.numberWithCommas(weekbestprofiteer.profit)}** M¢${firmconstr}`, true)
	if (check) firminfo.setThumbnail(client.users.get(message.author.id).displayAvatarURL)
	if (!check && redditlink) firminfo.setThumbnail(client.users.get(redditlink).displayAvatarURL)
	return message.channel.send({embed: firminfo})
	// we also need week's best profiteer
	/*{
  "embed": {
    "title": "The Nameless Bank",
    "url": "https://discordapp.com",
    "color": 15844367,
    "footer": {
      "icon_url": "https://cdn.discordapp.com/avatars/213704185517047808/db686ebf5a04d411784fda835ba4a370.png",
      "text": "Made by Thomas van Tilburg with ❤️"
    },
    "thumbnail": {
      "url": "https://cdn.discordapp.com/icons/575342300507406347/6c9207bdfefb6df6edad17fe2ee513bf.webp"
    },
    "image": {
      "url": "https://www.seekpng.com/png/small/100-1008726_pie-charts-png-transparent-pie-chart-png.png"
    },
    "author": {
      "name": "MemeBot",
      "url": "https://github.com/thomasvt1/MemeBot",
      "icon_url": "https://b.thumbs.redditmedia.com/aRUO-zIbXgMTDVJOcxKjY8P6rGkakMdyVXn4k1VN-Mk.png"
    },
    "fields": [
      {
        "name": "Balance",
        "value": "2,127,234,324,730 M¢",
        "inline": true
      },
      {
        "name": "Average investment profit:",
        "value": "something",
        "inline": true
      },
      {
        "name": "Your Rank",
        "value": "Floor Trader",
        "inline": true
      },
      {
        "name": "CEO",
        "value": "OutlandishZach",
        "inline": true
      },
      {
        "name": "CFO",
        "value": "utrebsto",
        "inline": true
      },
      {
        "name": "COO",
        "value": "Hayura",
        "inline": true
      },
      {
        "name": "Top Investors",
        "value": "1. Hayura--------\n2. YAH_YEETS\n3. CoolestNero\n4. utrebsto\n5. PaperTronics\n6. RegularNoodles\n7. fntastk\n8. OutlandishZach\n9. W3lcomeToReddit\n10. luisbg\n11. sanguineuphoria\n12. wMurdoch123\n13. Qmbia\n14. PepeIsStillAlive\n15. xxxJxshy\n16. Yaseralbaker\n17. BeetiF\n18. plaidypus53\n19. isalehin\n20. petrzjunior\n21. Keanu73\n22. Meme-Master420\n23. hydrophysicsguy",
        "inline": true
      },
      {
        "name": "Top 10 Inactive Investors",
        "value": "1. Yaseralbaker last invested: 110 hours ago\n2. hydrophysicsguy last invested: 55 hours ago\n3. isalehin last invested: 17 hours ago\n4. petrzjunior last invested: 17 hours ago\n5. utrebsto last invested: 16 hours ago\n6. Keanu73 last invested: 14 hours ago\n7. plaidypus53 last invested: 12 hours ago\n8. OutlandishZach last invested: 10 hours ago\n9. PepeIsStillAlive last invested: 10 hours ago\n10. W3lcomeToReddit last invested: 8 hours ago",
        "inline": true
      },
      {
        "name": "Your Estimated Payout",
        "value": "1,000,000,000 M¢",
        "inline": true
      }
    ]
  }
}*/
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [],
	permLevel: "User"
}

exports.help = {
	name: "firm",
	category: "MemeEconomy",
	description: "Presents various statistics about a firm, including top 10 active/inactive investors.",
	usage: "inactive <reddit username> (uses set default)"
}

function before_last_payout(inv_time) {
	return !((new Date(inv_time * 1000).getDay() === 5 && moment(inv_time).hour() < 23))
}