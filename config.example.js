const config = {
	// Development environment for testing
	node_env: "DEVELOPMENT",
	
	// Store the owner IDs in here. Default is Thomasvt's ID and Keanu73's ID.
	ownerIDs: ["213704185517047808", "115156616256552962"],

	// Your Bot's Token. Available on https://discordapp.com/developers/applications/me
	token: "bottoken",

	// Default per-server settings. New guilds have these settings. 

	// DO NOT LEAVE ANY OF THESE BLANK, AS YOU WILL NOT BE ABLE TO UPDATE THEM
	// VIA COMMANDS IN THE GUILD.
  
	defaultSettings: {
		prefix: "&",
		investmentChannel: 0,
		mentionEveryone: false
	},

	// Websocket settings for #investment-watch
	websocket: {
		url: "wss://meme.ws.thomasvt.xyz"
	},
	
	//MySQL DB for storing reddit usernames
	mysql: {
		host: "127.0.0.1",
		port: 3306,
		user: "user",
		password: "password",
		database: "memecord"
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
		{ level: 0,
			name: "User", 
			// Don't bother checking, just return true which allows them to execute any command their
			// level allows them to.
			check: () => true
		},

		// This is the server owner.
		{ level: 1,
			name: "Server Owner", 
			// Simple check, if the guild owner id matches the message author's ID, then it will return true.
			// Otherwise it will return false.
			check: (message) => message.channel.type === "text" ? (message.guild.ownerID === message.author.id ? true : false) : false
		},

		// This is the bot owner, this should be the highest permission level available.
		// The reason this should be the highest level is because of dangerous commands such as eval
		// or exec (if the owner has that).
		{
			level: 2,
			name: "Owner",
			// Another simple check, compares the message author id to the one stored in the config file.
			check: (message) => message.client.config.ownerIDs.some((ownerID) => ownerID === message.author.id)
		}
	]
}

module.exports = config
