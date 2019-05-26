const { RichEmbed } = require("discord.js")
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

	// Calculate profit %
	let profitprct = 0
	// eslint-disable-next-line prefer-const
	let investments = []
	let c = 0
	let investc = 0
	let page = 0
	while (c < firmmembers.length) {
		investc = firmmembers[c].investments
		const history = await client.api.getInvestorHistory(firmmembers[c].name, 100, page)
		investments.push(history)
		investc -= 100
		if (investc > 0) while (investc > 0) {
			page += 1
			const history = await client.api.getInvestorHistory(firmmembers[c].name, 100, page)
			investments.push(history)
			investc -= 100
		}
		
		if (investc < 100) while (investc > 0) {
			page = 0
			const history = await client.api.getInvestorHistory(firmmembers[c].name, investc, page)
			investments.push(history)
			investc -= 100
		}
		c++
	}

	for (let i = 0; i < investments.length; i++) {
		for (let f = 0; f < investments[f].length; f++) {
			if (investments[f].done === true) {
				console.log(profitprct)
				profitprct += investments[f].profit / investments[f].amount * 100
			}
		}
	}

	console.log(profitprct)

	profitprct /= firm.size // Calculate average % return

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
	activeinvestors.sort((a, b) => b.timediff + a.timediff)
  
	const firminfo = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter("Made by Thomas van Tilburg and Keanu73 with ❤️", "https://i.imgur.com/1t8gmE7.png")
		.setTitle(firm.name)
		.setURL(`https://meme.market/firm.html?firm=${user.firm}`)
		.addField("**Balance**", `${client.api.numberWithCommas(firm.balance)} M¢`, true)
		.addField("**Average investment profit**", `${profitprct}%`, true)
		.addField("**Your Rank**", user.firm_role === "" ? "Floor Trader": firmroles[user.firm_role], true)
		.addField("**Last investor**", `[u/${activeinvestors[0].name}]()\n**${Math.trunc(activeinvestors[0].timediff / 36e2)}** hours ago`, true)
		.addField("**Most inactive investor**", `[u/${inactiveinvestors[0].name}]()\n**${Math.trunc(inactiveinvestors[0].timediff / 36e2)}** hours ago`, true)
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
