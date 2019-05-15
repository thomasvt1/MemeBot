exports.run = (client, message, [name], _level) => {
	const check = client.api.getLink(message.author.id)
	let user

	if (name.length < 3 && !check) {
		message.reply(":thinking: Something tells me that is not a Reddit username")
	}

	client.api.getInvestorProfile(check ? check : name).then(body => {
		if (body.id === 0) return message.reply(":question: I couldn't find that user. Sorry")
		if (body.firm === 0 && !check) return message.reply(":x: This person isn't in a firm.")
		if (body.firm === 0 && check) return message.reply(":x: You're not in a firm.")
		if (body.name === name.toLowerCase() || body.name === check.toLowerCase()) user = body
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
