exports.run = (client, message, [name], level) => {
	const result = await getUserProfile(msg, args);

	if (result === null) {
		return;
	}

	const history = await getInvestorHistory(result.name);

	// Calculate profit %
	let profitprct = 0;
	let profitprct_5 = 0;
	for (let i = 0; i < history.length; i++) {
		if (history[i].done === true) {
			profitprct += history[i].profit / history[i].amount * 100;

			if (i <= 5) { // Use for average last 5
				profitprct_5 += history[i].profit / history[i].amount * 100;
			}
		}
	}

	profitprct /= history.length; // Calculate average % return
	profitprct_5 /= 5; // Calculate average % return for last 5


	// Calculate amount of investments today
	let investments_today = 0;
	for (const inv of history) {
		const timediff = Math.trunc(((new Date().getTime() / 1000) - inv.time) / 36e2); // 36e3 will result in hours between date objects
		if (timediff > 24)
			break;
		investments_today++;
	}

	let reply = "";

	reply += `Showing stats about ${result.name}\n`;

	reply += "```";
	reply += `Net worth: ${numberWithCommas(result.networth)} M$\n`
	reply += `Average investment profit: ${profitprct.toFixed(2)}%\n`
	reply += `Average last 5 investments profit: ${profitprct_5.toFixed(2)}%\n`
	if (history[0].done === false) {
		reply += `User does have running investment;\n`
		const score = await getScore(history[0].post);
		reply += `Invested at ${history[0].upvotes} upvotes post is now at ${score} upvotes\n`
	}

	const timediff = Math.trunc(((new Date().getTime() / 1000) - history[0].time) / 36e2); // 36e3 will result in hours between date objects
	reply += `Amount of investments last 24 hours: ${investments_today}\n`
	reply += `Last invested: ${timediff} hours ago\n`

	reply += "```";

	msg.channel.send(reply);
	
	const check = client.api.getLink(message.author.id)

	if (!name) message.reply(":question: I don't remember your name, and you haven't given me one.\n```Use $setname RedditName to set your name```")

	if (name.length < 3) {
		message.reply(":thinking: Something tells me that is not a Reddit username")
	}

	if (!check) client.api.getInvestorProfile(name).then(body => {
		if (body.id === 0) return message.reply(":question: I couldn't find that user. Sorry")
		if (body.name === name.toLowerCase()) client.api.setLink(message.author.id, body.name)
		return message.reply("I will remember that your Reddit username is " + name)
	})

	const update = client.api.updateLink(message.author.id, name)
	if (!update) return message.reply(":x: An error occurred while updating. Please contact Thomasvt1.")

	return message.reply("I will remember that your Reddit username is " + name)
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: ["h", "halp"],
	permLevel: "User"
}

exports.help = {
	name: "setname",
	category: "MemeEconomy",
	description: "Sets your reddit name to act as default for commands",
	usage: "setname <your reddit username>"
}
