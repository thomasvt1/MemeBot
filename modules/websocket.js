const { RichEmbed } = require("discord.js")
const moment = require("moment")
module.exports = async (client, investment) => {
	// note: investment watch should return something like this
	// { submid: reddit_post_id, upvotes: reddit_post_upvotes, comments: reddit_comments, timediff: postedat (seconds), investments: investments, highinvestments: highinvestments, username: reddit_poster, famous: false }
	client.guilds.forEach(async (guild) => {
		// investment watch channel will equal as channel id
		const settings = client.getSettings(guild)

		if (settings.investmentChannel === 0) return

		if (!client.channels.get(settings.investmentChannel)) return client.users.get("115156616256552962").send("Your #investment-watch channel is configured incorrectly!\nPlease use `&set edit investmentChannel <mention channel here>` to fix this problem.")

		const mentioneveryone = settings.mentionEveryone === "true" ? "@everyone" : ""

		const submission = await client.api.r.getSubmission(investment.submid).fetch().then((sub) => sub).catch(err => console.error(err))

		const user = await client.api.getInvestorProfile(investment.username).catch(err => client.logger.error(err.stack))

		const firm = await client.api.getFirmProfile(user.firm).catch(err => client.logger.error(err.stack))

		const firmroles = {
			assoc: "Associate",
			exec: "Executive",
			coo: "COO",
			cfo: "CFO",
			ceo: "COO"
		}


		const redditlink = await client.api.getRedditLink(investment.username.toLowerCase())

		const famous = investment.famous ? "<:famousmemer:582821955489628166>" : ""

		const redditpfp = await client.api.r.getUser(investment.username).fetch().then((usr) => usr.icon_img)

		let firmemoji = ""
		client.guilds.get("563439683309142016").emojis.forEach(async (e) => {
			if (e.name === firm.name.toLowerCase().replace(/ /g, "")) firmemoji = `<:${e.identifier.toString()}>`
		})

		const timeposted = moment.duration(investment.timediff, "seconds").format("[**]m[**] [minutes] [ago], [**]s[**] [seconds] [ago]")

		const investmentinfo = new RichEmbed()
			.setAuthor("MemeBot Investment Watch", client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
			.setColor("BLUE")
			.setFooter("Made by Thomas van Tilburg and Keanu73 with ❤️", "https://i.imgur.com/1t8gmE7.png")
			.setTitle(`${famous} u/${investment.username} ${firmemoji}`)
			.setURL(`https://meme.market/user.html?account=${investment.username}`)
			.setDescription(`**[${submission.title}](https://redd.it/${investment.submid})**`)
			.setImage(submission.thumbnail)
		if (user.firm !== 0) investmentinfo.addField("Firm", `**\`${user.firm_role === "" ? "Floor Trader" : firmroles[user.firm_role]}\`** of **\`${firm.name}\`**`, true)
			.addField("Time posted", timeposted, true)
			.addField("Upvotes", investment.upvotes.toString(), true)
			.addField("Investments", investment.investments.toString(), true)
			.addField("High investments", investment.highinvestments.toString(), true)
			.addField("Comments", investment.comments.toString(), true)
		if (redditlink) investmentinfo.setThumbnail(client.users.get(redditlink).displayAvatarURL)
		if (!redditlink) investmentinfo.setThumbnail(redditpfp)
		client.channels.get(settings.investmentChannel).send(mentioneveryone, { embed: investmentinfo })
	})
	return "Investment Watch: Success"
}