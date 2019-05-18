// The EVAL command will execute **ANY** arbitrary javascript code given to it.
// THIS IS PERMISSION LEVEL 10 FOR A REASON! It's perm level 10 because eval
// can be used to do **anything** on your machine, from stealing information to
// purging the hard drive. DO NOT LET ANYONE ELSE USE THIS


// However it's, like, super ultra useful for troubleshooting and doing stuff
// you don't want to put in a command.
const Discord = require("discord.js")
const moment = require("moment")
const hastebin = require("hastebin-gen")
exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
	const code = args.join(" ")
	try {
		const evaled = eval(code)
		const clean = await client.clean(client, evaled)
		if (!(clean.length <= 1980)) {
			hastebin(`// Eval results: \n//${moment().format("DD/MM/YYYY HH:mm:ss")}\n${clean}`).then(r => {
				if (client.checkEmbed(message.guild)) {
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
				} else {
					message.channel.send(`\u200b\n\n🇪 🇻 🇦 🇱     🇸 🇺 🇨 🇨 🇪 🇸 🇸 🇫 🇺 🇱    ✅\n\n ⚙ ** CODE:**\n\`\`\`js\n${code}\`\`\`\n➡ **RESULT:**\n\`\`\`js\n${r}\`\`\``)
				}
			}).catch(err => {
				if (client.checkEmbed(message.guild)) {
					const emb = new Discord.RichEmbed()
						.setTitle(":x: Error!")
						.setDescription(`An unexpected error occurred while uploading to Hastebin.\`\`\`js\n${client.clean(client, err.stack)}\`\`\``)
						.setAuthor(client.user.username, client.user.avatarURL)
						.setColor("RED")
						.setFooter(client.user.username, client.user.avatarURL)
						.setTimestamp()
					return message.channel.send({ embed: emb })
				} else {
					message.channel.send(`\u200b\nAn error occurred while uploading to Hastebin. ❌\n\n ⚙ ** CODE:**\n\`\`\`js\n${code}\`\`\`\n➡ **RESULT:**\n\`\`\`js\n${client.clean(client, err.stack)}\`\`\``)
				}
			})
		} else {
			if (client.checkEmbed(message.guild)) {
				const emb = new Discord.RichEmbed()
					.setTitle("Evaluation successful!")
					.setAuthor(client.user.username, client.user.avatarURL)
					.setColor("GREEN")
					.setFooter(client.user.username, client.user.avatarURL)
					.setTimestamp()
					.addField("Code", `\`\`\`js\n${code}\`\`\``)
					.addField("Result", `\`\`\`js\n${clean}\`\`\``)
				message.channel.send({ embed: emb })
			} else {
				message.channel.send(`\u200b\n\n🇪 🇻 🇦 🇱     🇸 🇺 🇨 🇨 🇪 🇸 🇸 🇫 🇺 🇱    ✅\n\n ⚙ ** CODE:**\n\`\`\`js\n${code}\`\`\`\n➡ **RESULT:**\n\`\`\`js\n${clean}\`\`\``)
			}
		}
	} catch (err) {
		if (!(err.length <= 1980)) {
			hastebin(`// Eval results: \n//${moment().format("DD/MM/YYYY HH:mm:ss")}\n${await client.clean(client, err)}`).then(r => {
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
			}).catch(err => {
				if (client.checkEmbed(message.guild)) {
					const emb = new Discord.RichEmbed()
						.setTitle(":x: Error!")
						.setDescription(`An unexpected error occurred while uploading to Hastebin.\`\`\`js\n${client.clean(client, err.stack)}\`\`\``)
						.setAuthor(client.user.username, client.user.avatarURL)
						.setColor("RED")
						.setFooter(client.user.username, client.user.avatarURL)
						.setTimestamp()
					return message.channel.send({ embed: emb })
				} else {
					message.channel.send(`\u200b\nAn error occurred while uploading to Hastebin. ❌\n\n ⚙ ** CODE:**\n\`\`\`js\n${code}\`\`\`\n➡ **RESULT:**\n\`\`\`js\n${err.stack}\`\`\``)
				}
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
