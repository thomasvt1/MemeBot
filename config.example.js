const config = {
	// Sentry.io functionality - error logging 
	sentry: {
		enabled: false,
		dsn: ""
	},
	
	// Store the owner IDs in here. Default is Thomasvt's ID and Keanu73's ID.
	ownerIDs: ["213704185517047808", "115156616256552962"],

	// Your Bot's Token. Available on https://discordapp.com/developers/applications/me
	token: "bottoken",

	// Websocket settings for #investment-watch
	websocket: {
		enabled: true,
		url: "wss://meme.ws.thomasvt.xyz"
	},

	// Google Analytics
	trackingID: "",
	
	//MongoDB for storing reddit usernames and guild settings
	mongodb: {
		url: "mongodb://127.0.0.1:27017/memebot"
	},

	// What we use to fetch submissions, etc
	reddit: {
		clientId: "clientid",
		clientSecret: "clientsecret",
		refreshToken: "obtain using reddit-oauth-helper",
		userAgent: "can be anything"
	},

	// PERMISSION LEVEL DEFINITIONS.

	permLevels: [
		// This is the lowest permisison level, this is for non-roled users.
		{
			level: 0,
			name: "User",
			// Don't bother checking, just return true which allows them to execute any command their
			// level allows them to.
			check: () => true
		},

		// This applies to users who have "Manage Server" permissions.
		{
			level: 1,
			name: "Server Admin",
			// Simple check, if the guild owner id matches the message author's ID, then it will return true.
			// Otherwise it will return false.
			check: (message) => message.guild ? (message.member.hasPermission("MANAGE_GUILD")) : false
		},

		// This is the server owner's level.
		{
			level: 2,
			name: "Server Owner",
			// Simple check, if the guild owner id matches the message author's ID, then it will return true.
			// Otherwise it will return false.
			check: (message) => message.guild ? (message.guild.ownerID === message.author.id) : false
		},

		// This is the bot owner, this should be the highest permission level available.
		// The reason this should be the highest level is because of dangerous commands such as eval
		// or exec (if the owner has that).
		{
			level: 3,
			name: "Owner",
			// Another simple check, compares the message author id to the one stored in the config file.
			check: (message) => message.client.config.ownerIDs.some((ownerID) => ownerID === message.author.id)
		}
	]
}

module.exports = config
