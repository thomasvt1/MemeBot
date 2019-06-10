// The MESSAGE event runs anytime a message is received
// Note that due to the binding of client to every event, every event
// goes `client, other, args` when this function is run.

module.exports = async (client, message) => {
	// It's good practice to ignore other bots. This also makes your bot ignore itself
	// and not get into a spam loop (we call that "botception").
	if (message.author.bot) return

	// Grab the settings for this server from Enmap.
	// If there is no guild, get default conf (DMs)
	const settings = message.guild ? client.getSettings(message.guild.id) : client.settings.get("default")

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

	if (level < client.levelCache[cmd.conf.permLevel]) {
		return message.channel.send(`You do not have permission to use this command.
  Your permission level is ${level} (${client.config.permLevels.find(l => l.level === level).name})
  This command requires level ${client.levelCache[cmd.conf.permLevel]} (${cmd.conf.permLevel})`)
	}

	// To simplify message arguments, the author's level is now put on level (not member so it is supported in DMs)
	// The "level" command module argument will be deprecated in the future.
	message.author.permLevel = level
  
	message.flags = []
	while (args[0] && args[0][0] === "-") {
		message.flags.push(args.shift().slice(1))
	}

	// If the command exists, **AND** the user has permission, run it.
	client.logger.cmd(`[CMD] ${client.config.permLevels.find(l => l.level === level).name} ${message.author.username} (${message.author.id}) ran command ${cmd.help.name} with ${args[0] ? `args ${args[0]}` : "no args"}`)

	if (cmd.help.category === "MemeEconomy" && cmd.help.name !== "top100") {
		const check = await client.api.getLink(message.author.id)

		if (!args[0] && !check) return message.channel.send(":question: Please supply a Reddit username.")

		if (args[0].length < 3 && !check) return message.channel.send(":thinking: Something tells me that is not a Reddit username")

		args[0] = args[0].replace(/^((\/|)u\/)/g, "")
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

		const discord_id = await client.api.getRedditLink(username.toLowerCase())

		const history = await client.api.getInvestorHistory(username.toLowerCase()).catch(err => client.logger.error(err.stack))

		const firmmembers = await client.api.getFirmMembers(profile.firm).catch(err => client.logger.error(err.stack))
		
		const arguments = cmd.help.name === "history" ? [username, discord_id, profile, history, firm, firmmembers, firmrole, check, investment] : [username, discord_id, profile, history, firm, firmmembers, firmrole, check]

		args = arguments
	}

	cmd.run(client, message, args, level)
}