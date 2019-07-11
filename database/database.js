/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* Original copyright (c) 2018 - 2019 SunburntRock89 (austinhuang0131 / discordtel)
/* All rights reserved.
*/
const mongoose = require("mongoose")
mongoose.Promise = global.Promise
mongoose.pluralize(null)
let Database = {}
exports.initialize = async url => new Promise((resolve, reject) => {
	mongoose.connect(url, {
		promiseLibrary: global.Promise,
		useNewUrlParser: true
	})
	const [Guilds, Names] = [
		mongoose.model("guilds", require("./guildSchema")),
		mongoose.model("names", require("./nameSchema"))
	]
	mongoose.connection
		.on("error", err => reject(err))
		.once("open", () => {
			Database = {
				Guilds, guilds: Guilds,
				Names, names: Names,
				Raw: mongoose.connection,
			}

			resolve(Database)
		})
})

exports.get = exports.getConnection = () => Database