const mongoose = require("mongoose")

module.exports = new mongoose.Schema({
	_id: { type: String, required: true },
	investmentChannel: { type: String, default: "0" },
	mentionEveryone: { type: Boolean, default: false },
	prefix: { type: String, default: "&" }
}, { usePushEach: true })