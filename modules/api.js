/*
/* api.numberWithCommas
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* Original copyright (c) 2018 - 2019 dzervas
/* All rights reserved.
/*
/* parseInvestmentAmount
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* Original copyright (c) 2019 thomasvt1
/* All rights reserved.
/*
/* api.getInvestments
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* Original copyright (c) 2019 thomasvt1
/* All rights reserved.
*/

// Interface with Meme.Market API
// Most of these functions are self-explanatory
// and further explanation for the
// MemeEconomy related functions are given on the API page (https://github.com/thecsw/memeinvestor_bot/tree/master/api)
const api = {}

const config = require("../config.js")
const rp = require("request-promise")
const snoowrap = require("snoowrap")
const LRU = require("lru-cache")

const MAX_CACHE_TIME = 1500000
const cache = new LRU({ max: 350, maxAge: MAX_CACHE_TIME }) // Max cache for 15 minutes.

api.r = new snoowrap({
	userAgent: config.reddit.userAgent,
	clientId: config.reddit.clientId,
	clientSecret: config.reddit.clientSecret,
	refreshToken: config.reddit.refreshToken
})

api.doRequest = async (options, usecache = true, time = MAX_CACHE_TIME) => {
	console.log(options.uri)
	if (usecache && cache.has(options.uri))
		return cache.get(options.uri)

	return new Promise(function (resolve, reject) {
		rp(options).then(function (parsedBody) {
			cache.set(options.uri, parsedBody, time)
			resolve(parsedBody)
		}).catch(err => {
			reject(err)
		})
	})
}

api.getInvestorProfile = async (name) => {
	/**
		* @description This gets the investor profile of a Reddit user.
		*
		* @param {string} name - The user's Reddit username
		* @return {InvestorProfile} See more at https://meme.market/api/investor/Keanu73
		*
		* @example
		* await api.getInvestorProfile("Keanu73")
		*/
	const options = {
		uri: "https://meme.market/api/investor/" + name,
		json: true
	}

	return api.doRequest(options)
}

api.getInvestorHistory = async (name, amount = 100, page = 0) => {
	/**
	* @description This gets the investor history of a Reddit user
	*
	* @param {string} name - The user's Reddit username
    * @param {number} amount - The amount of posts to query
	* @return {InvestorHistory} See more at https://meme.market/api/investor/Keanu73/investments?per_page=50&page=0
	*
	* @example
	* await api.getInvestorHistory("Keanu73")
	*/
	const options = {
		uri: `https://meme.market/api/investor/${name}/investments?per_page=${amount}&page=${page}`,
		json: true
	}

	return api.doRequest(options)
}

api.getFirmProfile = async (id) => {
	const options = {
		uri: "https://meme.market/api/firm/" + id,
		json: true
	}

	return api.doRequest(options)
}

api.getFirmMembers = async (id, page = 0, amount = 100) => {
	const options = {
		uri: `https://meme.market/api/firm/${id}/members?per_page=${amount}&page=${page}`,
		json: true
	}

	return api.doRequest(options)
}

api.getTopFirmMembers = async (id, page = 0, amount = 100) => {
	const options = {
		uri: `https://meme.market/api/firm/${id}/members/top?per_page=${amount}&page=${page}`,
		json: true
	}

	return api.doRequest(options)
}

api.getTop100 = async (amount = 25, page) => {
	const options = {
		uri: `https://meme.market/api/investors/top?per_page=${amount}&page=${page}`,
		json: true
	}

	return api.doRequest(options)
}

api.getRedditLink = async (client, reddit_name) => {
	const link = await client.names.findOne({ reddit_name: reddit_name }).lean()

	if (!link) return false

	return link._id
}

api.getLink = async (client, discord_id) => {
	const link = await client.names.findOne({ _id: discord_id }).lean()

	if (!link) return false

	return link.reddit_name
}

api.setLink = async (client, discord_id, reddit_name) => {
	const res = await client.names.create({
		_id: discord_id,
		reddit_name: reddit_name
	})

	if (!res) return false

	return res
}

api.updateLink = async (client, discord_id, reddit_name) => {
	const link = await client.names.findOne({ _id: discord_id })

	if (!link) return false

	link.reddit_name = reddit_name

	await link.save()

	return true
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

// eslint-disable-next-line jsdoc/require-jsdoc
function isNumber(str) {
	const pattern = /^\d+$/
	return pattern.test(str)
}

// eslint-disable-next-line jsdoc/require-jsdoc
function parseInvestmentAmount(str) {
	str = str.replace(/,|\./g, "")

	str = str.replace("k", "000")
	str = str.replace("m", "000000")
	str = str.replace("b", "000000000")
	str = str.replace("t", "000000000000")
	return str
}

// Returns Map<string, string>
api.getInvestments = async (comments) => {
	let investments = 0
	let botreply = false

	for (const reply of comments) {
		if (reply.author.name === "MemeInvestor_bot" && reply.stickied === true) botreply = reply
	}

	if (!botreply) return false

	const botreplies = await botreply.replies.fetchAll()

	for (const investment of botreplies) {
		if (investment.body.startsWith("!invest ")) {
			const inv = investment.body.replace("!invest", "")

			if (isNumber(inv)) {
				investments++
			} else {
				const p_inv = parseInvestmentAmount(inv)
				if (p_inv) investments++
			}
		}
	}

	return investments
}


module.exports = api