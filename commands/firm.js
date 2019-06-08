const { RichEmbed } = require("discord.js")
const moment = require("moment")
const fs = require("fs")
const exporter = require("highcharts-export-server")
exports.run = async (client, message, [username, redditlink, user, _history, firm, firmmembers, firmrole, check], _level) => {
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
			profitprct += (investments[i].profit - investments[i].profit * (investments[i].firm_tax / 100)) / investments[i].amount * 100 // investor profit ratio
		}
	}

	profitprct /= investments.length // Calculate average % return

	// Calculate week's best profiteer, also include contribution to firm balance

	const weekprofiteers = []

	for (const member of firmmembers) {
		const history = await client.api.getInvestorHistory(member.name)
		let weekprofit = 0
		let weekcontrib = 0
		let i = 0
		while (i < history.length && history[i].time > firm.last_payout) {
			weekprofit += history[i].profit - history[i].profit * (history[i].firm_tax / 100)
			weekcontrib += history[i].profit * (history[i].firm_tax / 100)
			i++
		}

		weekprofiteers.push({ name: member.name, profit: weekprofit, contrib: weekcontrib})
	}

	weekprofiteers.sort((a, b) => b.profit - a.profit)

	const weekbestprofiteer = weekprofiteers[0]
	const weekworstprofiteer = weekprofiteers[weekprofiteers.length - 1]
	const bfirmcontribution = weekbestprofiteer.contrib
	const wfirmcontribution = weekworstprofiteer.contrib
	const bfirmconstr = `\nContributed **${client.api.numberWithCommas(Math.trunc(bfirmcontribution))}** M¢ to firm (**${((bfirmcontribution / firm.balance) * 100).toFixed(2)}%**)`
	const wfirmconstr = `\nContributed **${client.api.numberWithCommas(Math.trunc(wfirmcontribution))}** M¢ to firm (**${((wfirmcontribution / firm.balance) * 100).toFixed(2)}%**)`

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

	const yourrole = check ? "Your Role" : `${username}'s Role`

	let firmimage = false
	client.guilds.get("563439683309142016").emojis.forEach(async (e) => {
		if (e.name === firm.name.toLowerCase().replace(/ /g, "")) firmimage = e.url
	})

	const firminfo = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter("Made by Thomas van Tilburg and Keanu73 with ❤️", "https://i.imgur.com/1t8gmE7.png")
		.setTitle(firm.name)
		.setURL(`https://meme.market/firm.html?firm=${user.firm}`)
		.addField("Balance", `${client.api.numberWithCommas(firm.balance)} M¢`, true)
		.addField("Average investment profit", `${profitprct.toFixed(3)}%`, true)
		.addField("Rank", `\`#${firm.rank}\``, true)
		.addField(yourrole, firmrole, true)
		.addField("Last investor", `[u/${activeinvestors[0].name}](https://meme.market/user.html?account=${activeinvestors[0].name})\n${lastinvestor}`, true)
		.addField("Most inactive investor", `[u/${inactiveinvestors[0].name}](https://meme.market/user.html?account=${inactiveinvestors[0].name})\n${mostinactiveinvestor}`, true)
		.addField("CEO", firm.ceo, true)
		.addField("COO", firm.coo, true)
		.addField("CFO", firm.cfo, true)
		.addField("Week's best profiteer", `[u/${weekbestprofiteer.name}](https://meme.market/user.html?account=${weekbestprofiteer.name})\n**${client.api.numberWithCommas(weekbestprofiteer.profit)}** M¢${bfirmconstr}`, true)
		.addField("Week's worst profiteer", `[u/${weekworstprofiteer.name}](https://meme.market/user.html?account=${weekworstprofiteer.name})\n**${client.api.numberWithCommas(weekworstprofiteer.profit)}** M¢${wfirmconstr}`, true)
	if (firmimage) firminfo.setThumbnail(firmimage)
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
*/
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

function exportPieChart(trader, assoc, exec, cfo, coo, ceo) {
	//Export settings
	const exportSettings = {
		type: "png",
		options: {
			chart: {
				backgroundColor: "transparent",
				plotBorderWidth: null,
				plotShadow: false,
				type: "pie",
			},
			credits: {
				enabled: false
			},
			plotOptions: {
				pie: {
					dataLabels: {
						enabled: true,
						format: "<b>{point.name}</b><br>{point.percentage:.1f}%",
						distance: -50,
						filter: {
							property: "percentage",
							operator: ">",
							value: 4
						},
						style: {
							textOutline: false,
							fontFamily: "Arial",
							fontSize: "10px"
						}
					}
				}
			},
			title: {
				text: undefined
			},
			series: [{
				data: [{ name: "Floor<br>Traders", y: trader }, { name: "Associates", y: assoc }, { name: "Executives", y: exec }, { name: "OutlandishZach", y: ceo }, { name: "Hayura----", y: coo }, { name: "RegularNoodles", y: cfo }]
			}]
		}
	}

	//Set up a pool of PhantomJS workers
	exporter.initPool()

	//Perform an export
	/*
			Export settings corresponds to the available CLI arguments described
			above.
	*/
	exporter.export(exportSettings, function (err, res) {
		//The export result is now in res.
		//If the output is not PDF or SVG, it will be base64 encoded (res.data).
		//If the output is a PDF or SVG, it will contain a filename (res.filename).
		fs.writeFileSync("./result.png", res.data, { encoding: "base64" }, function (err) {
			throw err
		})

		//Kill the pool when we're done with it, and exit the application
		exporter.killPool()
		process.exit(1)
	})
}