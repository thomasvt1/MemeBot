// The EVAL command will execute **ANY** arbitrary javascript code given to it.
// THIS IS PERMISSION LEVEL 10 FOR A REASON! It's perm level 10 because eval
// can be used to do **anything** on your machine, from stealing information to
// purging the hard drive. DO NOT LET ANYONE ELSE USE THIS


// However it's, like, super ultra useful for troubleshooting and doing stuff
// you don't want to put in a command.
const Discord = require("discord.js")
const moment = require("moment")
const PastebinAPI = require("pastebin-js"),
	pastebin = new PastebinAPI("38d22ed98a3a3134febb112c1be23189")
exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
	const code = args.join(" ")
	try {
		const evaled = eval(code)
		const clean = await client.clean(client, evaled)
		if (!(clean.length <= 1980)) {
			pastebin.createPaste(`// Eval results: \n//${moment().format("DD/MM/YYYY HH:mm:ss")}\n${clean}`, "MemeBot eval results", null, 1).then(r => {
				const emb = new Discord.RichEmbed()
					.setTitle("The eval results were too large")
					.setDescription("So I uploaded them to Hastebin!")
					.setAuthor(client.user.username, client.user.avatarURL)
					.setColor(0x3669FA)
					.setFooter("Sorry for the inconvenience", client.user.avatarURL)
					.setTimestamp()
					.addField("Code", `\`\`\`js\n${code}\`\`\``)
					.addField("Result", `\n${r}`)
				return message.channel.send({ embed: emb })
			}).fail(err => {
				console.log(err)
				const emb = new Discord.RichEmbed()
					.setTitle(":x: Error!")
					.setDescription(`An unexpected error occurred while uploading to Hastebin.\`\`\`js\n${client.clean(client, err.stack)}\`\`\``)
					.setAuthor(client.user.username, client.user.avatarURL)
					.setColor("RED")
					.setFooter(client.user.username, client.user.avatarURL)
					.setTimestamp()
				return message.channel.send({ embed: emb })
			})
		} else {
			const emb = new Discord.RichEmbed()
				.setTitle("Evaluation successful!")
				.setAuthor(client.user.username, client.user.avatarURL)
				.setColor("GREEN")
				.setFooter(client.user.username, client.user.avatarURL)
				.setTimestamp()
				.addField("Code", `\`\`\`js\n${code}\`\`\``)
				.addField("Result", `\`\`\`js\n${clean}\`\`\``)
			message.channel.send({ embed: emb })
		}
	} catch (err) {
		if (!(err.length <= 1980)) {
			pastebin.createPaste(`// Eval results: \n//${moment().format("DD/MM/YYYY HH:mm:ss")}\n${await client.clean(client, err)}`, "MemeBot eval results", null, 1).then(r => {
				const emb = new Discord.RichEmbed()
					.setTitle("The eval results were too large")
					.setDescription("So I uploaded them to Hastebin!")
					.setAuthor(client.user.username, client.user.avatarURL)
					.setColor(0x3669FA)
					.setFooter("Sorry for the inconvenience", client.user.avatarURL)
					.setTimestamp()
					.addField("Code", `\`\`\`js\n${code}\`\`\``)
					.addField("Result", `\n${r}`)
				return message.channel.send({ embed: emb })
			}).fail(err => {
				console.log(err)
				const emb = new Discord.RichEmbed()
					.setTitle(":x: Error!")
					.setDescription(`An unexpected error occurred while uploading to Hastebin.\`\`\`js\n${client.clean(client, err.stack)}\`\`\``)
					.setAuthor(client.user.username, client.user.avatarURL)
					.setColor("RED")
					.setFooter(client.user.username, client.user.avatarURL)
					.setTimestamp()
				return message.channel.send({ embed: emb })
			})
		} else {
			const error = new Discord.RichEmbed()
				.setTitle("Evaluation unsuccessful!")
				.setAuthor(client.user.username, client.user.avatarURL)
				.setColor("RED")
				.setFooter(client.user.username, client.user.avatarURL)
				.setTimestamp()
				.addField("Code", `\`\`\`js\n${code}\`\`\``)
				.addField("Result", `\`\`\`js\n${await client.clean(client, err.stack)}\`\`\``)
			message.channel.send({ embed: error })
		}
	}
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [],
	permLevel: "Owner"
}

exports.help = {
	name: "eval",
	category: "System",
	description: "Evaluates arbitrary javascript.",
	usage: "eval [...code]"
}
