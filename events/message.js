/* Copyright (c) 2019 thomasvt1 / MemeBot
/* Original copyright (c) 2018 YorkAARGH (https://github.com/AnIdiotsGuide/guidebot) (AnIdiotsGuide / guidebot)
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

const analytics = require("../modules/analytics.js")

module.exports = async (client, message) => {
	// It's good practice to ignore other bots. This also makes your bot ignore itself
	// and not get into a spam loop (we call that "botception").
	if (message.author.bot) return

	// Grab the settings for this server from Enmap.
	// If there is no guild, get default conf (DMs)
	const settings = await client.getSettings(message.guild)

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
	const args = message.content.slice(settings.prefix.length).trim().split(/ +/g)
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

	// If the command exists, **AND** the user has permission, run it.
	const excludedcmds = ["top100", "setname"]
	const exclude = excludedcmds.some(c => c === cmd.help.name)
	let info = cmd.conf.info

	if (cmd.help.category === "MemeEconomy" && !exclude) {
		//const arguments = [user, discord_id, history, firm, isusername]
		const inf = []

		// Filter username with regex so that someone doesn't put u/ for the hell of it.
		let username = args[0] === undefined ? args[0] : args[0].replace(/^((\/|)u\/)/g, "")
		let isusername = true
		const check = await client.api.getLink(client, message.author.id)
		// We check if the user with the username exists. It might just be the arg of a command.
		// Who cares.
		let user = await client.api.getInvestorProfile(username).catch(err => {
			if (err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
			client.logger.error(err.stack)
		})

		if (username !== undefined && message.mentions.users.first()) {
			// Did they mean to run the command on someone else in their Discord?
			// We check the setname DB for them.
			const mention = await client.api.getLink(client, message.mentions.users.first().id)
			user = await client.api.getInvestorProfile(mention).catch(err => {
				if (err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
				client.logger.error(err.stack)
			})
			if (user.id === 0) return message.channel.send(":question: I couldn't find that Discord user in my database.")
			// So it seems they do exist.
			username = user.name
		}

		// So we think they include a username when
		// they haven't. Just default to their own.
		if (username !== undefined && user.id === 0 && check) {
			user = await client.api.getInvestorProfile(check).catch(err => {
				if (err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
				client.logger.error(err.stack)
			})
			username = user.name
			isusername = false
		}

		// So they didn't include a username but have set their name?
		// Jolly-ho, then!
		if (username === undefined && user.id === 0 && check) {
			user = await client.api.getInvestorProfile(check).catch(err => {
				if (err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
				client.logger.error(err.stack)
			})
			username = user.name
			isusername = false
		}

		if (isusername && user.id === 0 && !check) return message.channel.send(":question: I couldn't find that MemeEconomy user.")
		if (!isusername && user.id === 0 && !check) return message.channel.send(`:question: Please supply a Reddit username, or use \`${settings.prefix}setname <reddit username>\`.`)

		// Let's just remove their username for simplicity.
		if (isusername) args.shift()

		if (info.some(i => i === "user")) {
			inf.push(user)
		}

		if (info.some(i => i === "discord_id")) {
			inf.push(await client.api.getRedditLink(client, username).catch(err => client.logger.error(err.stack)))
		}

		if (info.some(i => i === "history")) {
			inf.push(await client.api.getInvestorHistory(username).catch(err => {
				if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
				client.logger.error(err.stack)
			}))
		}

		if (info.some(i => i === "firm")) {
			inf.push(await client.api.getFirmProfile(user.firm).catch(err => {
				if (err.statusCode && err.statusCode !== 200 && err.statusCode !== 400) return message.channel.send(":exclamation: The meme.market API is currently down, please wait until it comes back up.")
				client.logger.error(err.stack)
			}))
		}

		if (info.some(i => i === "isusername")) {
			inf.push(isusername)
		}

		await Promise.all(inf)

		info = inf
	}

	const parameters = [client, message, args, level]
	if (cmd.help.category === "MemeEconomy" && !exclude) parameters.splice(3, 0, info)
	const start = Date.now()
	client.logger.cmd(`${client.config.permLevels.find(l => l.level === level).name} ${message.author.username} (${message.author.id}) ran command ${cmd.help.name} with ${args[0] ? `args ${args[0]}` : "no args"} (started)`)
	cmd.run.apply(null, parameters).then(() => {
		const end = Date.now()
		const timediff = (end - start) / 1000
		if (client.config.trackingID && client.config.trackingID.length != 0)
			analytics.logCommand(client, message, cmd.help.name)

		client.logger.cmd(`${client.config.permLevels.find(l => l.level === level).name} ${message.author.username} (${message.author.id}) ran command ${cmd.help.name} with ${args[0] ? `args ${args[0]}` : "no args"} (executed in ${timediff}s)`)
	})
}
