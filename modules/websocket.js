/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* All rights reserved.
*/

const { RichEmbed } = require("discord.js")
const moment = require("moment")
module.exports = async (client, investment) => {
	// note: investment watch should return something like this
	// { submid: reddit_post_id, upvotes: reddit_post_upvotes, comments: reddit_comments, timediff: postedat (seconds), investments: investments, highinvestments: highinvestments, username: reddit_poster, famous: false }
	//const famousmemers = ["organic_crystal_meth", "Hyp3r__", "SlothySurprise", "RegularNoodles", "JonathanTheZero", "TooEarlyForFlapjacks", "UncreativeFilth", "bleach_tastes_bad"]

	const submission = await client.api.r.getSubmission(investment.submid).fetch().then((sub) => sub).catch(err => client.logger.error(err.stack))

	// First, query the API to make sure it's actually up.
	let error = false
	const user = await promiseTimeout(client.api.getInvestorProfile(investment.username), 8000).catch(err => {
		client.logger.error(err)
		error = true
	})

	let firmemoji = ""

	if (!error) {

		const firm = await client.api.getFirmProfile(user.firm).catch(err => client.logger.error(err.stack))

		//const famous = famousmemers.some(c => investment.username === c.toLowerCase()) ? "<:famousmemer:582821955489628166>" : ""

		firmemoji = firm.id !== 0 ? client.firmEmoji(firm.name) : ""
		
	}

	const timeposted = moment.duration(investment.timediff, "seconds").format("[**]m[**] [minutes] [ago], [**]s[**] [seconds] [ago]")

	let msg = ""
	msg += `This meme was posted ${timeposted} and should be profitable!\n`
	msg += `There are currently **${investment.comments}** comments and **${investment.upvotes}** upvotes. I also count **${investment.investments}** investments and **${investment.highinvestments}** high investments.\n`
	msg += `https://redd.it/${investment.submid}`

	client.guilds.forEach(async (guild) => {
		// investment watch channel will equal as channel id
		const settings = await client.settings.findById(guild.id)

		client.logger.log(`Guild ${guild.name} (${guild.id}) with owner ${guild.owner.user.tag} (${guild.ownerID}), channel ${settings.investmentChannel} with mentionEveryone ${settings.mentionEveryone}`)

		if (settings.investmentChannel === "0") return

		if (!client.channels.get(settings.investmentChannel)) {
			settings.investmentChannel = "0"
			await settings.save()
			if (!guild.owner) return client.logger.error(`Unable to reach guild owner ${guild.owner.user.tag} (${guild.ownerID})`)
			return guild.owner.send(`Your #investment-watch channel was configured incorrectly!\nPlease use \`${settings.prefix}set edit investmentChannel <mention channel here>\` to fix this problem in your ${guild.name} server.\nFor now, investment watch in your server has been disabled to prevent any further errors and DMs.`).catch(err => client.logger.error(`Error with ${guild.owner.user.tag} (${guild.ownerID}) on server ${guild.name} (${guild.id}): ${err.stack}`))
		}

		const mentioneveryone = settings.mentionEveryone === true ? "@everyone" : ""

		const investmentinfo = new RichEmbed()
			.setAuthor("MemeBot Investment Watch", client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
			.setColor("GOLD")
			.setFooter("Made by Thomas van Tilburg and Keanu73 with ❤️", "https://i.imgur.com/1t8gmE7.png")
			.setTitle(`u/${investment.username} ${firmemoji}`)
			.setURL(`https://meme.market/user.html?account=${investment.username}`)
			.setThumbnail(submission.thumbnail)
			.setDescription(`**__[${submission.title}](https://redd.it/${investment.submid})__**\n\n${msg}`)
		client.channels.get(settings.investmentChannel).send(mentioneveryone, { embed: investmentinfo })
	})
	return "Success"
}

const promiseTimeout = function (promise, ms) {

	let id
	const timeout = new Promise((resolve, reject) => {
		id = setTimeout(() => {
			reject("Timed out in " + ms + "ms.")
		}, ms)
	})

	return Promise.race([
		promise,
		timeout
	]).then((result) => {
		clearTimeout(id)

		/**
		 * ... we also need to pass the result back
		 */
		return result
	})
}