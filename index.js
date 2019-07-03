/* Copyright (c) 2019 thomasvt1 / MemeBot
/* Original copyright (c) 2018 YorkAARGH
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

// This will check if the node version you are running is the required
// Node version, if it isn't it will throw the following error to inform
// you.
if (Number(process.version.slice(1).split(".")[0]) < 8) throw new Error("Node 8.0.0 or higher is required. Update Node on your system.")

// Load up the discord.js library
const Discord = require("discord.js")

// We also load the rest of the things we need in this file:
const { promisify } = require("util")
const readdir = promisify(require("fs").readdir)
const Enmap = require("enmap")

// This is your client. Some people call it `bot`, some people call it `self`,
// some might call it `cootchie`. Either way, when you see `client.something`,
// or `bot.something`, this is what we're refering to. Your client.
const client = new Discord.Client()

// Here we load the config file that contains our token and our prefix values. (checks for debugging case)
if (!require("./config.js")) throw new Error("You don't have a config file! Please create one from config.example.js.")
client.config = require("./config.js")
// client.config.token contains the bot's token
// client.config.prefix contains the message prefix



// Add Meme.Market and Reddity related functions into codebase
client.api = require("./modules/api.js")

// Add investment calculating crap and whatever in
client.math = require("./modules/math.js")

// Require our logger
client.logger = require("./modules/Logger")

// Let's start by getting some useful functions that we'll use throughout
// the bot, like logs and elevation features.
require("./modules/functions.js")(client)

// Aliases and commands are put in collections where they can be read from,
// catalogued, listed, etc.
client.commands = new Enmap()
client.aliases = new Enmap()

// We're doing real fancy node 8 async/await stuff here, and to do that
// we need to wrap stuff in an anonymous function. It's annoying but it works.

const init = async () => {

	// Here we load **commands** into memory, as a collection, so they're accessible
	// here and everywhere else.
	const cmdFiles = await readdir("./commands/")
	client.logger.log(`Loading a total of ${cmdFiles.length} commands.`)
	cmdFiles.forEach(f => {
		if (!f.endsWith(".js")) return
		const response = client.loadCommand(f)
		if (response) console.log(response)
	})

	// Then we load events, which will include our message and ready event.
	const evtFiles = await readdir("./events/")
	client.logger.log(`Loading a total of ${evtFiles.length} events.`)
	evtFiles.forEach(file => {
		const eventName = file.split(".")[0]
		client.logger.log(`Loading Event: ${eventName}`)
		const event = require(`./events/${file}`)
		// Bind the client to any event, before the existing arguments
		// provided by the discord.js event. 
		// This line is awesome by the way. Just sayin'.
		client.on(eventName, event.bind(null, client))
	})

	// Generate a cache of client permissions for pretty perm names in commands.
	client.levelCache = {}
	for (let i = 0; i < client.config.permLevels.length; i++) {
		const thisLevel = client.config.permLevels[i]
		client.levelCache[thisLevel.name] = thisLevel.level
	}

	// Here we login the client.
	client.login(client.config.token)

	const database = await require("./database/database").initialize(client.config.mongodb.url).catch(err => {
		client.logger.error(`Failed to intialize Database: ${err}`)
		process.exit(1)
	})

	// eslint-disable-next-line no-undef
	client.settings = database.Guilds

	// eslint-disable-next-line no-undef
	client.names = database.Names

	// End top-level async/await function.
}

init()
