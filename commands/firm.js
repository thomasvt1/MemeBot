const { RichEmbed } = require("discord.js")
exports.run = (client, message, [name], _level) => {
	const check = client.api.getLink(message.author.id)
	const username = check ? check : name
	let user

	if (name.length < 3 && !check) {
		message.reply(":thinking: Something tells me that is not a Reddit username")
	}

	client.api.getInvestorProfile(check ? check : name).then(body => {
		if (body.id === 0) return message.reply(":question: I couldn't find that user. Sorry")
		if (body.firm === 0 && !check) return message.reply(":x: This person isn't in a firm.")
		if (body.firm === 0 && check) return message.reply(":x: You're not in a firm.")
		user = body
	})

	const firm = client.api.getFirmProfile(user.firm)
	const firmmembers = client.api.getFirmMembers(user.firm)

	const lastinvestment = []

	for (const member of firmmembers) {
		const history = client.api.getInvestorHistory(member.name, 1)
		if (history[0] !== undefined)
			lastinvestment.push({ name: member.name, timediff: Math.trunc(new Date().getTime() / 1000) - history[0].time })
	}

	lastinvestment.sort((a, b) => b.timediff - a.timediff)

	const listsize = Math.min(10, lastinvestment.length)

	if (!client.checkEmbed(message.guild.me)) {
		let reply = `Currently ${firm.size} investors in ${firm.name}. Here are the ${listsize} most inactive investors\n` + "```"

		for (let i = 0; i <= listsize; i++) {
			if (lastinvestment[i] === undefined)
				continue
			const timediff = Math.trunc(lastinvestment[i].timediff / 36e2) // 36e3 will result in hours between date objects
			reply += `${i + 1}. ${lastinvestment[i].name} last invested: ${timediff} hours ago\n`
		}

		reply += "```"
		message.channel.send(reply)
	} else {
	//insert embed here
	//	const stats = new RichEmbed()
	//		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeCord")
	//		.setColor("GOLD")
	//		.setFooter("Made by Thomas van Tilburg with ❤️", client.users.get(client.config.ownerID).avatarURL)
	//		.setTitle(`u/${check ? check : name}`)
	//		.setURL(`https://reddit.com/u/${check ? check : name}`)
	//		.addField("**Net worth**", `${client.api.numberWithCommas(user.networth)} M¢`, true)
	//		.addField("**Average investment profit**", ``, true)
	//		.addField("**Average investment profit (last 5)**", ``, true)
	//		.addField("**Investments last 24 hours**", `${investments_today}`, true)
  //		.addField("**Last invested**", `${lastinvested} hours ago`, true)
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
