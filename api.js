// Interface with Meme.Market API
const bot = require("./index.js")
const rp = require("request-promise")
module.exports = async (client) => {
	async function getInvestorProfile(name) {
		const options = {
			uri: "https://meme.market/api/investor/" + name,
			json: true
		}
        
		return new Promise(function (resolve, reject) {
			rp(options).then(function (parsedBody) {
				resolve(parsedBody)
			}).catch(err => {
				reject(err)
			})
		})
	}

	async function getInvestorHistory(name, amount = 15) {
		const options = {
			uri: `https://meme.market/api/investor/${name}/investments?per_page=${amount}&page=0`,
			json: true
		}

		return new Promise(function (resolve, reject) {
			rp(options).then(function (parsedBody) {
				resolve(parsedBody)
			}).catch(err => {
				reject(err)
			})
		})
	}

	async function getFirmProfile(id) {
		const options = {
			uri: "https://meme.market/api/firm/" + id,
			json: true
		}

		return new Promise(function (resolve, reject) {
			rp(options).then(function (parsedBody) {
				resolve(parsedBody)
			}).catch(err => {
				reject(err)
			})
		})
	}

	async function getFirmMembers(id) {
		const options = {
			uri: `https://meme.market/api/firm/${id}/members?per_page=100&page=0/`,
			json: true
		}

		return new Promise(function (resolve, reject) {
			rp(options).then(function (parsedBody) {
				resolve(parsedBody)
			}).catch(err => {
				reject(err)
			})
		})
	}

	async function getLink(discord_id) {
		const [link] = await client.pool.execute("SELECT reddit_name FROM reddit_link WHERE discord_id = ?", [discord_id])

		if (!link[0]) return false

		return link[0].reddit_name
	}

	async function setLink(discord_id, reddit_name) {
		const res = await client.pool.execute("INSERT INTO reddit_link (discord_id, reddit_name) VALUES (?, ?)", [discord_id, reddit_name])

		if (!res) return false

		return res
	}

	async function updateLink(discord_id, reddit_name) {
		const res = await client.pool.execute("UPDATE reddit_link SET reddit_name = ? WHERE reddit_link.discord_id = ?", [reddit_name, discord_id])
		
		if (!res) return false

		return res
	}
}