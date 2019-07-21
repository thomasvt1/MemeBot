/* Copyright (c) 2019 thomasvt1 / MemeBot
/* Original copyright (c) 2018 YorkAARGH (https://github.com/AnIdiotsGuide/guidebot)
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
	const settings = await client.settings.findOne({ _id: message.guild.id })
	const defaults = await client.settings.findById("default")

	// Edit an existing key value
	if (action === "edit") {
		// User must specify a key.
		if (!key) return message.reply("Please specify a key to edit")
		// User must specify a key that actually exists!
		if (typeof defaults[key] === "undefined") return message.reply("This key does not exist in the settings")
		let joinedValue = value.join(" ")
		// User must specify a value to change.
		if (joinedValue.length < 1) return message.reply("Please specify a new value")
		// User must specify a different value than the current one.
		if (joinedValue === settings.get(key)) return message.reply("This setting already has that value!")
		// Do the hard work that the user doesn't have to do.
		if (key === "investmentChannel" && message.mentions.channels.first()) joinedValue = message.mentions.channels.first().id
		// Validation. Always good.
		if (key === "investmentChannel" && !client.channels.get(joinedValue) && joinedValue !== "0") return message.reply("The channel you specified doesn't exist!")

		if (key === "mentionEveryone" && joinedValue !== "true" && joinedValue !== "false") return message.reply("`mentionEveryone` can only be true or false.")

		// Modify the guild overrides directly.
		settings[key] = joinedValue
		await settings.save()

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
			settings[key] = defaults[key]
			await settings.save()
			message.reply(`\`${key}\` was successfully reset to default.`)
		} else
		// If they respond with n or no, we inform them that the action has been cancelled.
		if (["n", "no", "cancel"].includes(response)) {
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
		// Get the lean object of the MongoDB document as we don't need to modify it.
		const settingsObj = await client.getSettings(message.guild)
		// Simplicity.
		Object.entries(settingsObj).forEach(([key, value]) => {
			if (key !== "_id" && key !== "__v") array.push(`${key}${" ".repeat(20 - key.length)}::  ${value}`)
		})
		await message.channel.send(`= Current Guild Settings =\n${array.join("\n")}`, { code: "asciidoc" })
	}
}

exports.conf = {
	enabled: true,
	guildOnly: true,
	aliases: ["setting", "settings", "conf"],
	permLevel: "Server Admin"
}

exports.help = {
	name: "set",
	category: "System",
	description: "View or change settings for your server.",
	usage: "set <none/get/edit> <none/key> <none/value>"
}
