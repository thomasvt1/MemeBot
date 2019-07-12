const WebSocket = require("ws")
const websockethandler = require("../modules/websocket.js")
const logger = require("../modules/Logger.js")
module.exports = async client => {

	await client.settings.findByIdAndUpdate("default").setOptions({ upsert: true, setDefaultsOnInsert: true })

	// Log that the bot is online.
	client.logger.log(`${client.user.tag}, ready to serve ${client.users.size} users in ${client.guilds.size} servers.`, "ready")

	// Make the bot "play the game" which is the help command with default prefix.
	client.user.setPresence({ game: { name: `MemeEconomy for ${client.guilds.size} servers ❤️`, type: "WATCHING" }, status: "online" })

	startWebSocket(client)
}

let ws // The websocket client

/**
 * 
 * @description Starts the websocket server, binds events to proper locations.
 * 
 * @example 
 * startWebsocket(client)
 * 
 * @param {object} client - The Discord.js client object.
 */
function startWebSocket(client) {
	ws = new WebSocket(client.config.websocket.url)

	ws.addEventListener("error", (err) => {
		client.logger.error(`WebSocket: ${err.message}\nPlease configure your WebSocket server in ./config.js!`)
		ws.close(404)
	})

	ws.on("message", async (data) => {
		client.logger.log(`Investment Watch: ${data}`)
		if (data.toString().includes("submid")) {
			const res = await websockethandler(client, JSON.parse(data.toString()))
			client.logger.log(`Investment Watch: ${res}`)
		}
	})

	ws.on("open", heartbeat)
	ws.on("ping", heartbeat)
	ws.on("close", function clear() {
		clearTimeout(this.pingTimeout)
		client.logger.log("Investment Watch: Connection Closed, Reconnecting...")
		setTimeout(() => {
			startWebSocket(client)
			client.logger.log("Investment Watch: Reconnected")
		}, 5000)
		
	})
}

/**
 * 
 * @description Stops the connection from being terminated and sets it again until another ping is sent.
 * 
 * @example
 * ws.on("ping", heartbeat)
 */
function heartbeat() {
	clearTimeout(this.pingTimeout)
	// Use `WebSocket#terminate()` and not `WebSocket#close()`. Delay should be
	// equal to the interval at which your server sends out pings plus a
	// conservative assumption of the latency.
	this.pingTimeout = setTimeout(() => {
		logger.log("Investment Watch: Terminating Connection")
		this.terminate()
	}, 30000 + 20)
}
