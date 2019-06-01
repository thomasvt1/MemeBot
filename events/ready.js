const WebSocket = require("ws")
const websockethandler = require("../modules/websocket.js")
module.exports = async client => {

	// Log that the bot is online.
	client.logger.log(`${client.user.tag}, ready to serve ${client.users.size} users in ${client.guilds.size} servers.`, "ready")

	// Make the bot "play the game" which is the help command with default prefix.
	client.user.setPresence({ game: { name: `MemeEconomy for ${client.guilds.size} servers ❤️`, type: "WATCHING" }, status: "online" })
	
	const ws = new WebSocket(client.config.websocket.url)

	ws.addEventListener("error", (err) => {
		client.logger.error(`WebSocket: ${err.message}\nPlease configure your WebSocket server in ./config.js!`)
		ws.close(404)
	})

	ws.on("message", async (data) => {
		client.logger.log(`Investment Watch: ${data}`, "cmd")
		if (data.toString().includes("submid")) {
			const res = await websockethandler(client, JSON.parse(data.toString()))
			client.logger.log(res)
		}
	})

	ws.on("open", heartbeat)
	ws.on("ping", heartbeat)
	ws.on("close", function clear() {
		clearTimeout(this.pingTimeout)
	})
}

function heartbeat() {
	clearTimeout(this.pingTimeout)

	// Use `WebSocket#terminate()` and not `WebSocket#close()`. Delay should be
	// equal to the interval at which your server sends out pings plus a
	// conservative assumption of the latency.
	this.pingTimeout = setTimeout(() => {
		this.terminate()
	}, 10000 + 20)
}
