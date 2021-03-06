/*
/* Copyright (c) 2019 thomasvt1 / MemeBot
/* All rights reserved.
*/

const { RichEmbed } = require("discord.js")
const moment = require("moment")
exports.run = async (client, message, _args, [user, firm, isusername], _level) => {
	if (firm.id === 0) return message.channel.send(`:exclamation: ${isusername ? `${user.name} is` : "You are"} not in a firm!`)

	const firmname = firm.name.endsWith("s") ? `${firm.name}'` : `${firm.name}'s`
	const lastpayout = moment.duration((new Date().getTime() / 1000) - firm.last_payout, "seconds").format("[**]Y[**] [year], [**]D[**] [day], [**]H[**] [hour] [and] [**]m[**] [minutes] [ago]")

	let firmimage = "https://cdn.discordapp.com/emojis/588029928063107230.png"
	client.guilds.get("563439683309142016").emojis.forEach(async (e) => {
		if (e.name === firm.name.toLowerCase().replace(/ /g, "")) firmimage = e.url
	})

	// Display the user's or your role.
	const floorrank = user.firm_role === "" ? `(${isusername ? `${user.name}'s` : "Your"} Role)` : ""
	const assocrank = user.firm_role === "assoc" ? `(${isusername ? `${user.name}'s` : "Your"} Role)` : ""
	const execrank = user.firm_role === "exec" ? `(${isusername ? `${user.name}'s` : "Your"} Role)` : ""
	const boardmems = `(${firm.cfo !== "" && firm.cfo !== "0" ? `${firm.cfo}, ` : ""}${firm.coo !== "" && firm.coo !== "0" ? `${firm.coo}, ` : ""}${firm.cfo !== "" && firm.cfo !== "0" || firm.coo !== "" && firm.coo !== "0" ? "and " : ""}${firm.ceo})`

	// Accurately count board members to have a more accurate payout number.
	let boardmemc = 0
	if (firm.cfo !== "" && firm.cfo !== "0") boardmemc += 1
	if (firm.coo !== "" && firm.coo !== "0") boardmemc += 1
	if (firm.ceo !== "" && firm.ceo !== "0") boardmemc += 1

	const floortraders = firm.size - boardmemc - firm.execs - firm.assocs

	const payout = await client.math.calculateFirmPayout(firm.balance, firm.size, firm.execs, firm.assocs, firm.cfo !== "" && firm.cfo !== "0" ? firm.cfo : false, firm.coo !== "" && firm.coo !== "0" ? firm.coo : false)

	const firminfo = new RichEmbed()
		.setAuthor(client.user.username, client.user.avatarURL, "https://github.com/thomasvt1/MemeBot")
		.setColor("GOLD")
		.setFooter("Made by Thomas van Tilburg and Keanu73 with ❤️", "https://i.imgur.com/1t8gmE7.png")
		.setTitle(`${firmname} Estimated Payout`)
		.setURL(`https://meme.market/firm.html?firm=${user.firm}`)
		.addField("Payout Balance", `**${client.api.numberWithCommas(Math.trunc(payout.total))}** M¢`, true)
		.addField("Last Payout", lastpayout, true)
	if (floortraders > 0) firminfo.addField(`${floortraders} Floor Traders ${floorrank}`, `will get **${client.api.numberWithCommas(Math.trunc(payout.trader.amount))}** M¢ each\n(**${client.api.getSuffix(payout.trader.total)}** M¢ in total)`, false)
	if (firm.assocs > 0) firminfo.addField(`${firm.assocs} Associates ${assocrank}`, `will get **${client.api.numberWithCommas(Math.trunc(payout.assoc.amount))}** M¢ each\n(**${client.api.getSuffix(payout.assoc.total)}** M¢ in total)`, false)
	if (firm.execs > 0) firminfo.addField(`${firm.execs} Executives ${execrank})`, `will get **${client.api.numberWithCommas(Math.trunc(payout.exec.amount))}** M¢ each\n(**${client.api.getSuffix(payout.exec.total)}** M¢ in total)`, false)
	if (boardmemc > 0) firminfo.addField(`Board Members ${boardmems}`, `will get **${client.api.numberWithCommas(Math.trunc(payout.board.amount))}** M¢ each\n(**${client.api.getSuffix(payout.board.total)}** M¢ in total)`, false)
		.setThumbnail(firmimage)
	return message.channel.send({ embed: firminfo })
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [],
	permLevel: "User",
	info: ["user", "firm", "isusername"]
}

exports.help = {
	name: "payout",
	category: "MemeEconomy",
	description: "Displays the estimated payouts for yours/someone else's firm.",
	usage: "payout <reddit username> (uses set default)"
}
