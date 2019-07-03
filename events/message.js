/* Copyright (c) 2019 thomasvt1 / MemeBot
/* Original copyright (c) 2018 YorkAARGH (AnIdiotsGuide / guidebot)
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

// The MESSAGE event runs anytime a message is received
// Note that due to the binding of client to every event, every event
// goes `client, other, args` when this function is run.

module.exports = async (client, message) => {
	// It's good practice to ignore other bots. This also makes your bot ignore itself
	// and not get into a spam loop (we call that "botception").
	if (message.author.bot) return

	// Grab the settings for this server from Enmap.
	// If there is no guild, get default conf (DMs)
	const settings = await client.getSettings(message.guild.id)

	// Checks if the bot was mentioned, with no message after it, returns the prefix.
	const prefixMention = new RegExp(`^<@!?${client.user.id}>( |)$`)
	if (message.content.match(prefixMention)) {
		return message.reply(`My prefix on this guild is \`${settings.prefix}\``)
	}

	// Also good practice to ignore any message that does not start with our prefix,
	// which is set in the configuration file.
	if (message.content.indexOf(settings.prefix) !== 0) return

	if (message.guild && !message.channel.memberPermissions(message.guild.me).has("SEND_MESSAGES"))
		return message.author.send(`:exclamation: I'm unable to send messages to <#${message.channel.id}>!`)

	// Here we separate our "command" name, and our "arguments" for the command.
	// e.g. if we have the message "+say Is this the real life?" , we'll get the following:
	// command = say
	// args = ["Is", "this", "the", "real", "life?"]
	let args = message.content.slice(settings.prefix.length).trim().split(/ +/g)
	const command = args.shift().toLowerCase()

	// If the member on a guild is invisible or not cached, fetch them.
	if (message.guild && !message.member) await message.guild.fetchMember(message.author)

	// Get the user or member's permission level from the elevation
	const level = client.permlevel(message)

	// Check whether the command, or alias, exist in the collections defined
	// in app.js.
	const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command))
	// using this const varName = thing OR otherthign; is a pretty efficient
	// and clean way to grab one of 2 values!
	if (!cmd) return

	// Some commands may not be useable in DMs. This check prevents those commands from running
	// and return a friendly error message.
	if (cmd && !message.guild && cmd.conf.guildOnly)
		return message.channel.send("This command is unavailable via private message. Please run this command in a guild.")

	if (level < client.levelCache[cmd.conf.permLevel]) return

	// To simplify message arguments, the author's level is now put on level (not member so it is supported in DMs)
	// The "level" command module argument will be deprecated in the future.
	message.author.permLevel = level
  
	message.flags = []
	while (args[0] && args[0][0] === "-") {
		message.flags.push(args.shift().slice(1))
	}

	// If the command exists, **AND** the user has permission, run it.
	client.logger.cmd(`[CMD] ${client.config.permLevels.find(l => l.level === level).name} ${message.author.username} (${message.author.id}) ran command ${cmd.help.name} with ${args[0] ? `args ${args[0]}` : "no args"}`)

	const excludedcmds = ["top100", "leaderboard", "setname"]

	if (cmd.help.category === "MemeEconomy" && !excludedcmds.some(c => cmd.help.name === c)) {
		const check = await client.api.getLink(client, message.author.id)

		if (!args[0] && !check) return message.channel.send(":question: Please supply a Reddit username.")

		if (!check && args[0].length < 3) return message.channel.send(":thinking: Something tells me that is not a Reddit username")

		args[0] = check ? args[0] : args[0].replace(/^((\/|)u\/)/g, "")
		const username = check ? check : args[0]

		const investment = cmd.help.name === "history" ? args[1] : false

		const profile = await client.api.getInvestorProfile(username.toLowerCase()).catch(err => client.logger.error(err.stack))
		if (profile.id === 0) return message.channel.send(":question: I couldn't find that MemeEconomy user.")

		const firm = await client.api.getFirmProfile(profile.firm).catch(err => client.logger.error(err.stack))

		const firmroles = {
			assoc: "Associate",
			exec: "Executive",
			coo: "COO",
			cfo: "CFO",
			ceo: "COO"
		}

		const firmrole = profile.firm_role === "" ? "Floor Trader" : firmroles[profile.firm_role]

		const discord_id = await client.api.getRedditLink(client, username.toLowerCase())

		const history = await client.api.getInvestorHistory(username.toLowerCase()).catch(err => client.logger.error(err.stack))

		const firmmembers = await client.api.getFirmMembers(profile.firm).catch(err => client.logger.error(err.stack))
		
		const arguments = cmd.help.name === "history" ? [username, discord_id, profile, history, firm, firmmembers, firmrole, check, investment] : [username, discord_id, profile, history, firm, firmmembers, firmrole, check]

		args = arguments
	}

	cmd.run(client, message, args, level)
}