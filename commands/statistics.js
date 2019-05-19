const { RichEmbed, version } = require("discord.js")
const moment = require("moment")
require("moment-duration-format")

exports.run = (client, message, args, level) => { // eslint-disable-line no-unused-vars
	const duration = moment.duration(client.uptime).format(" D [days], H [hrs], m [mins], s [secs]")
	const bot = moment(client.user.createdTimestamp).format("dddd MMMM Do YYYY,") + " at " + moment(client.user.createdTimestamp).format("LTS")
	const stats = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeCord")
		.setColor("GOLD")
		.setFooter("Made by Thomas van Tilburg with ❤️", client.users.get(client.config.ownerID).avatarURL)
		.setThumbnail(client.user.avatarURL)
		.addField("🖥 Process Statistics", `**Memory used:** \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\`\nUptime: **${duration}**`, true)
		.addField("📊 Bot Statistics", `Since the bot was made on **${bot}**, we have gained **${client.guilds.size.toLocaleString()} servers.**`, true)
		.addField("⌨ Code Statistics", `This bot was made with:\n**Discord.js v${version},**\n**Node.js ${process.version}**\n**and** 🤔`, true)
	message.channel.send({ embed: stats })
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [],
	permLevel: "User"
}

exports.help = {
	name: "statistics",
	category: "Miscellaneous",
	description: "Gives some useful bot statistics",
	usage: "statistics"
}
