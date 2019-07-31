/*
/* This is a dummy websocket server, designed to test Investment Watch.
/* Any questions, just contact me, Keanu73#2193.
*/

const WebSocket = require("ws")

function noop() {}

function heartbeat() {
	this.isAlive = true
}

const wss = new WebSocket.Server({ port: 3000 })

wss.on("connection", ws => {
	ws.isAlive = true
	ws.on("pong", heartbeat)
	console.log("new guy..")
	setTimeout(() => {
		ws.send(
			JSON.stringify({
				submid: "bvgqu2",
				upvotes: 0,
				comments: 18,
				timediff: 47,
				investments: 8,
				highinvestments: 8,
				username: "CoolestNero"
			})
		)
	}, 3000)
})

const interval = setInterval(function ping() {
	wss.clients.forEach(function each(ws) {
		if (ws.isAlive === false) return ws.terminate()
		console.log("still connected")
		ws.isAlive = false
		ws.ping(noop)
	})
}, 30000)