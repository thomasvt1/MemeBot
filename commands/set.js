// This command is to modify/edit guild configuration. Perm Level 3 for admins
// and owners only. Used for changing prefixes and role names and such.

// Note that there's no "checks" in this basic version - no config "types" like
// Role, String, Int, etc... It's basic, to be extended with your deft hands!

// Note the **destructuring** here. instead of `args` we have :
// [action, key, ...value]
// This gives us the equivalent of either:
// const action = args[0]; const key = args[1]; const value = args.slice(2);
// OR the same as:
// const [action, key, ...value] = args;
exports.run = async (client, message, [action, key, ...value], level) => { // eslint-disable-line no-unused-vars

	// Retrieve current guild settings (merged) and overrides only.
	const settings = client.settings.get(message.guild.id)
	const defaults = client.config.defaultSettings
	if (!client.settings.has(message.guild.id)) client.settings.set(message.guild.id, {})
  
	// Edit an existing key value
	if (action === "edit") {
		// User must specify a key.
		if (!key) return message.reply("Please specify a key to edit")
		// User must specify a key that actually exists!
		if (!defaults[key]) return message.reply("This key does not exist in the settings")
		let joinedValue = value.join(" ")
		// User must specify a value to change.
		if (joinedValue.length < 1) return message.reply("Please specify a new value")
		// User must specify a different value than the current one.
		if (joinedValue === settings[key]) return message.reply("This setting already has that value!")
    
		// If the guild does not have any overrides, initialize it.
		if (!client.settings.has(message.guild.id)) client.settings.set(message.guild.id, {})

		if (key === "investmentChannel" && message.mentions.channels.first()) joinedValue = message.mentions.channels.first().id

		if (key === "investmentChannel" && !client.channels.get(joinedValue)) return message.reply("The channel you specified doesn't exist!")

		if (key === "mentionEveryone" && joinedValue !== "true" && joinedValue !== "false") return message.reply("`mentionEveryone` can only be true or false.")

		// Modify the guild overrides directly.
		client.settings.set(message.guild.id, joinedValue, key)

		// Confirm everything is fine!
		message.reply(`\`${key}\` successfully edited to \`${joinedValue}\``)
	} else
  
	// Resets a key to the default value
	if (action === "del" || action === "reset") {
		if (!key) return message.reply("Please specify a key to reset.")
		if (!defaults[key]) return message.reply("This key does not exist in the settings")
    
		// Good demonstration of the custom awaitReply method in `./modules/functions.js` !
		const response = await client.awaitReply(message, `Are you sure you want to reset \`${key}\` to the default value?`)

		// If they respond with y or yes, continue.
		if (["y", "yes"].includes(response.toLowerCase())) {
			// We delete the `key` here.
			client.settings.delete(message.guild.id, key)
			message.reply(`\`${key}\` was successfully reset to default.`)
		} else
		// If they respond with n or no, we inform them that the action has been cancelled.
		if (["n","no","cancel"].includes(response)) {
			message.reply(`Your setting for \`${key}\` remains at \`${settings[key]}\``)
		}
	} else
  
	if (action === "get") {
		if (!key) return message.reply("Please specify a key to view")
		if (!defaults[key]) return message.reply("This key does not exist in the settings")
		message.reply(`The value of \`${key}\` is currently \`${settings[key]}\``)
	} else {
		// Otherwise, the default action is to return the whole configuration;
		const array = []
		Object.entries(settings).forEach(([key, value]) => {
			array.push(`${key}${" ".repeat(20 - key.length)}::  ${value}`) 
		})
		await message.channel.send(`= Current Guild Settings =\n${array.join("\n")}`, {code: "asciidoc"})
	}
}

exports.conf = {
	enabled: true,
	guildOnly: true,
	aliases: ["setting", "settings", "conf"],
	permLevel: "Server Owner"
}

exports.help = {
	name: "set",
	category: "System",
	description: "View or change settings for your server.",
	usage: "set <view/get/edit> <key> <value>"
}
