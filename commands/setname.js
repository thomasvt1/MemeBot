exports.run = (client, message, args, level) => {
    
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: ["h", "halp"],
	permLevel: "User"
}

exports.help = {
	name: "setname",
	category: "MemeEconomy",
	description: "Sets your reddit name to act as default for commands",
	usage: "help [command]"
}
