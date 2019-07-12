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

exports.run = async (client, message, args, level) => {// eslint-disable-line no-unused-vars
	if (!args || args.length < 1) return message.reply("Must provide a command to reload. Derp.")

	let response = await client.unloadCommand(args[0])
	if (response) return message.reply(`Error Unloading: ${response}`)

	response = client.loadCommand(args[0])
	if (response) return message.reply(`Error Loading: ${response}`)

	message.reply(`The command \`${args[0]}\` has been reloaded`)
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [],
	permLevel: "Owner"
}

exports.help = {
	name: "reload",
	category: "System",
	description: "Reloads a command that\"s been modified.",
	usage: "reload [command]"
}
