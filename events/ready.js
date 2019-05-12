module.exports = async client => {

	/*function setLink(discord_id: string, reddit_name: string) {
		pool.execute(
			"INSERT INTO `reddit_link` (`discord_id`, `reddit_name`) VALUES (?, ?);",
			[discord_id, reddit_name],
		);
	}

	export async function getLink(discord_id: string): Promise<string | undefined> {
		const [rows, fields] = await pool.execute("SELECT `reddit_name` FROM `reddit_link` WHERE `discord_id` LIKE ?;", [discord_id]);

		if (rows[0] === undefined)
			return undefined;

		return rows[0].reddit_name;
	}

	export function updateLink(discord_id: string, reddit_name: string) {
		pool.execute(
			"UPDATE `reddit_link` SET `reddit_name` = ? WHERE `reddit_link`.`discord_id` = ?;",
			[reddit_name, discord_id],
		);
	}*/
	// Log that the bot is online.
	client.logger.log(`${client.user.tag}, ready to serve ${client.users.size} users in ${client.guilds.size} servers.`, "ready")

	// Make the bot "play the game" which is the help command with default prefix.
	client.user.setPresence({ game: { name: `all the memes for ${client.guilds.size} servers ❤️`, type: "WATCHING" }, status: "online" })
	
}
