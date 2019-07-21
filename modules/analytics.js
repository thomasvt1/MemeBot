/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* All rights reserved.
*/

const ua = require("universal-analytics")
const getUuid = require("uuid-by-string")

const analytics = {}

// eslint-disable-next-line jsdoc/require-jsdoc
function getTrackingID(client) {
	return client.config.trackingID
}

analytics.logCommand = async (client, message, command) => {
	const track = ua(getTrackingID(client), getUuid(message.author.id), { strictCidFormat: false })
	const params = { // https://github.com/peaksandpies/universal-analytics/blob/HEAD/AcceptableParams.md
		dp: command,
		dr: message.guild ? message.guild.name : message.author.username,
		cid: getUuid(message.author.id),
		ua: message.guild ? message.guild.name : message.author.username,
		an: "memebot"
	}

	client.logger.log(`Google Analytics: ${params}`)
	try {
		track.pageview(params).send()
	} catch (exception) {
		client.logger.error(exception)
	}
}

module.exports = analytics