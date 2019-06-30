/* Copyright (c) 2019 thomasvt1 / MemeBot
/* Original copyright (c) 2018 YorkAARGH
/* Last modified by Keanu73 <keanu@keanu73.net> on 2019-06-30
/* All rights reserved.
/*
MIT License

Copyright (c) 2018 YorkAARGH

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*
The HELP command is used to display every command's name and description
to the user, so that he may see what commands are available. The help
command is also filtered by level, so if a user does not have access to
a command, it is not shown to them. If a command name is given with the
help command, its extended help is shown.
*/
const { RichEmbed } = require("discord.js")
exports.run = (client, message, args, level) => {
	// If no specific command is called, show all filtered commands.
	if (!args[0]) {
		const settings = message.guild ? client.getSettings(message.guild.id) : client.settings.get("default")
		const prefix = settings.prefix
		const help = new RichEmbed()
			.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
			.setColor("BLUE")
			.setFooter("Made by Thomas van Tilburg and Keanu73 with ❤️", "https://i.imgur.com/1t8gmE7.png")
			.setThumbnail(client.user.avatarURL)
			.setTitle("List of Commands")
			.setDescription(`You can set a default account to run these commands with by using ${prefix}setname.`)
			// Filter all commands by which are available for the user's level, using the <Collection>.filter() method.
		const myCommands = message.guild ? client.commands.filter(cmd => client.levelCache[cmd.conf.permLevel] <= level) : client.commands.filter(cmd => client.levelCache[cmd.conf.permLevel] <= level && cmd.conf.guildOnly !== true)
		myCommands.forEach(c => {
			help.addField(c.help.name, c.help.description, false)
		})
		message.channel.send({ embed: help })
	} else {
		// Show individual command's help.
		let command = args[0]
		if (client.commands.has(command)) {
			command = client.commands.get(command)
			if (level < client.levelCache[command.conf.permLevel]) return
			const help = new RichEmbed()
				.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
				.setColor("GOLD")
				.setFooter("Made by Thomas van Tilburg and Keanu73 with ❤️", "https://i.imgur.com/1t8gmE7.png")
				.setTitle(command.help.name)
				.setDescription(command.help.description)
				.addField("Usage", command.help.usage, true)
			if (command.conf.aliases.join(", ")) help.addField("Aliases", command.conf.aliases.join(", "), true)
			message.channel.send({ embed: help })
		}
	}
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: ["h", "halp"],
	permLevel: "User"
}

exports.help = {
	name: "help",
	category: "System",
	description: "Displays all the available commands for your permission level.",
	usage: "help [command]"
}
