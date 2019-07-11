const mongoose = require("mongoose")

module.exports = new mongoose.Schema({
	_id: { type: String, required: true },
	reddit_name: { type: String, default: "", required: true }
}, { usePushEach: true })