// Interface with Meme.Market API
// Most of these functions are self-explanatory
// and further explanation for the
// MemeEconomy related functions are given on the API page (https://github.com/thecsw/memeinvestor_bot/tree/master/api)
const api = {}

const config = require("./config.js").node_env === "DEVELOPMENT" ? require("./config.test.js") : require("./config.js")
const mysql = require("mysql2/promise")
const rp = require("request-promise")
const snoowrap = require("snoowrap")
api.r = new snoowrap({
	userAgent: config.reddit.userAgent,
	clientId: config.reddit.clientId,
	clientSecret: config.reddit.clientSecret,
	refreshToken: config.reddit.refreshToken
})

// Add MySQL database for storing Discord + Reddit links
const pool = !config.node_env === "DEVELOPMENT" ? mysql.createPool({
	host: config.mysql.host,
	port: config.mysql.port,
	user: config.mysql.user,
	password: config.mysql.password,
	database: config.mysql.database,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
}) : false

api.getInvestorProfile = async function (name) {
	/**
		* This gets the investor profile of a Reddit user.
		*
		* @param {string} name - The user's Reddit username
		* @return {InvestorProfile} See more at https://meme.market/api/investor/Keanu73
		*
		* @example
		*
		*     api.getInvestorProfile("Keanu73")
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

api.getInvestorHistory = async function (name, amount = 50) {
	/**
	* This gets the investor history of a Reddit user
	*
	* @param {string} name - The user's Reddit username
    * @param {number} amount - The amount of posts to query
	* @return {InvestorHistory} See more at https://meme.market/api/investor/Keanu73/investments?per_page=50&page=0
	*
	* @example
	*
	*     api.getInvestorHistory("Keanu73")
	*/
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

api.getFirmProfile = async function (id) {
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

api.getFirmMembers = async function (id) {
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

api.getTop100 = async function (page, amount = 25) {
	const options = {
		uri: `https://meme.market/api/investors/top?per_page=${amount}&page=${page}`,
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

api.getRedditLink = async function (reddit_name) {
	if (config.node_env === "DEVELOPMENT") return false

	const [link] = await pool.execute("SELECT discord_id FROM reddit_link WHERE reddit_name = ?", [reddit_name])

	if (!link[0]) return false

	return link[0].discord_id
}

api.getLink = async function (discord_id) {
	if (config.node_env === "DEVELOPMENT") return false

	const [link] = await pool.execute("SELECT reddit_name FROM reddit_link WHERE discord_id = ?", [discord_id])

	if (!link[0]) return false

	return link[0].reddit_name
}

api.setLink = async function (discord_id, reddit_name) {
	if (config.node_env === "DEVELOPMENT") return false

	const res = await pool.execute("INSERT INTO reddit_link (discord_id, reddit_name) VALUES (?, ?)", [discord_id, reddit_name])

	if (!res) return false

	return res
}

api.updateLink = async function (discord_id, reddit_name) {
	if (config.node_env === "DEVELOPMENT") return false

	const res = await pool.execute("UPDATE reddit_link SET reddit_name = ? WHERE reddit_link.discord_id = ?", [reddit_name, discord_id])
		
	if (!res) return false

	return res
}

// Some hacky regex to make numbers look nicer
api.numberWithCommas = function (x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

api.getSuffix = function (val) {
	const number = parseInt(val)
	const abbrev = ["", "K", "M", "B", "T", "q", "Q", "s", "S"]
	const unrangifiedOrder = Math.floor(Math.log10(Math.abs(number)) / 3)
	const order = Math.max(0, Math.min(unrangifiedOrder, abbrev.length - 1))
	const suffix = abbrev[order]
	const precision = suffix ? 1 : 0
	const value = (number / Math.pow(10, order * 3)).toFixed(precision)

	return value + " " + suffix
}

module.exports = api