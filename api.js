// Interface with Meme.Market API
const rp = require("request-promise")
module.exports = async () => {
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
}