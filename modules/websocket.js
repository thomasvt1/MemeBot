const { RichEmbed } = require("discord.js")
module.exports = async (client, investment) => {
	if (investment.toString().includes("submid")) {
		investment = JSON.parse(investment.toString())
		for (const guild in client.guilds) {
			// investment watch channel will equal as channel id
			const settings = client.getSettings(guild)
            
			let submission
			await client.api.r.getSubmission(investment.submid).fetch().then((sub) => submission = sub).catch(err => console.error(err))
            
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
            
			// top 10 firm emojis

			const investmentinfo = new RichEmbed()
				.setAuthor("MemeBot Investment Watch", client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
				.setColor("BLUE")
				.setFooter("Made by Thomas van Tilburg and Keanu73 with ❤️", "https://i.imgur.com/1t8gmE7.png")
				.setTitle(`${famous} u/${investment.username} <:solenterprises:582821691831353366>`)
				.setURL(`https://meme.market/user.html?account=${investment.username}`)
				.setDescription(`**[${submission.title}](https://redd.it/${investment.submid})**`)
				.setImage(submission.thumbnail)
				.addField("Firm", `**\`${user.firm_role === "" ? "Floor Trader" : firmroles[user.firm_role]}\`** of **\`${firm.name}\`**`, true)
			if (redditlink) investmentinfo.setThumbnail(client.users.get(redditlink).displayAvatarURL)
			if (!redditlink) investmentinfo.setThumbnail(redditpfp) 
			return client.channels.get(settings.investmentChannel).send({embed: investmentinfo})
		}
	}
}