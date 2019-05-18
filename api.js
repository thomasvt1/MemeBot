// Interface with Meme.Market API
// Most of these functions are self-explanatory
// and further explanation for the
// MemeEconomy related functions are given on the API page (https://github.com/thecsw/memeinvestor_bot/tree/master/api)
const client = require("./index.js").client
const rp = require("request-promise")
const snoowrap = require("snoowrap")
const r = new snoowrap({
	userAgent: client.config.reddit.userAgent,
	clientId: client.config.reddit.clientId,
	clientSecret: client.config.reddit.clientSecret,
	refreshToken: client.config.reddit.refreshToken
})
module.exports = async () => {
	async function getInvestorProfile(name) {
		/**
		* This gets the investor profile of a Reddit user.
		*
		* @param {string} name - The user's Reddit username
		* @return {InvestorProfile} See more at https://meme.market/api/investor/Keanu73
		*
		* @example
		*
		*     getInvestorProfile("Keanu73")
		*/
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

	async function getRedditLink(reddit_name) {
		const [link] = await client.pool.execute("SELECT discord_id FROM reddit_link WHERE reddit_name = ?", [reddit_name])

		if (!link[0]) return false

		return link[0].discord_id
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

	// Some hacky regex to make numbers look nicer
	function numberWithCommas(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	}

	async function getSubmission(submid) {
		return r.getSubmission(submid)
	}
}