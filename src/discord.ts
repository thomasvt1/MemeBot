import * as Discord from 'discord.js';
import { getConfig } from './config';
import { getInvestorProfile, getFirmMembers, getInvestorHistory, getFirmProfile } from './network';
import { InvestorProfile } from './network.d';
import { setLink, getLink, updateLink } from './database';
import { getScore, getSubmission } from './reddit';
import { calculateInvestmentReturn, calculateBreakEvenPoint } from './calculator';

const client = new Discord.Client({});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setPresence({ game: { name: `All the memes for you ❤️`, type: 'WATCHING' }, status: 'online' });
});

client.on('disconnect', () => {
    startClient();
});

client.on('error', () => {
    startClient();
});

client.on('message', msg => {
    if (!msg.content.startsWith("$")) {
        return;
    }

    const args = msg.content.split(/ +/);

    if (msg.content.startsWith("$help")) {
        return help(msg, args);
    }

    if (msg.content.startsWith("$setname")) {
        return setname(msg, args);
    }

    if (msg.content.startsWith("$stats")) {
        return stats(msg, args);
    }

    if (msg.content.startsWith("$inactive")) {
        return inactive(msg, args);
    }

    if (msg.content.startsWith("$firmtop")) {
        return firmtop(msg, args);
    }

    if (msg.content.startsWith("$active")) {
        return active(msg, args);
    }

    if (msg.content.startsWith("$average")) {
        return average_investments(msg, args);
    }
});

async function help(msg: Discord.Message, args: string[]) {
    let reply = "";

    reply += `Hi ${msg.author.username}, here's a quick list of what I can help you with\n`;

    reply += "```";
    reply += "• $help - The menu you are in now!\n";
    reply += "• $stats - See your statistics\n";
    reply += "• $inactive - See the inactive members in your firm\n";
    reply += "• $firmtop - See the leaderboard of your firm\n";
    reply += "• $active - See the leaderboard of your firm\n";
    reply += "• $average - See the average investments\n";
    reply += "• $setname - Make MemeBot remember your Reddit name\n";

    reply += "\n\nYou can use every command with a Reddit name behind it, but using $setname you can set a default account";
    reply += "```";

    msg.channel.send(reply);
}

async function setname(msg: Discord.Message, args: string[]) {
    if (args.length < 2) {
        msg.reply("The correct usage is ``$setname yourname``");
        return;
    }

    const result = await getUserProfile(msg, args);

    if (result === null) {
        return;
    }

    if (await getLink(msg.author.id) === undefined) {
        setLink(msg.author.id, result.name);
    } else {
        updateLink(msg.author.id, result.name);
    }


    msg.reply("I will remember your Reddit username is " + result.name);
}

async function stats(msg: Discord.Message, args: string[]) {
    const result = await getUserProfile(msg, args);

    if (result === null) {
        return;
    }

    const history = await getInvestorHistory(result.name);

    // Calculate profit %
    let profitprct = 0;
    let profitprct_5 = 0;
    for (let i = 0; i < history.length; i++) {
        if (history[i].done === true) {
            profitprct += history[i].profit / history[i].amount * 100;

            if (i <= 5) { // Use for average last 5
                profitprct_5 += history[i].profit / history[i].amount * 100;
            }
        }
    }

    profitprct /= history.length; // Calculate average % return
    profitprct_5 /= 5; // Calculate average % return for last 5


    // Calculate amount of investments today
    let investments_today = 0;
    for (const inv of history) {
        const timediff = Math.trunc(((new Date().getTime() / 1000) - inv.time) / 36e2); // 36e3 will result in hours between date objects
        if (timediff > 24)
            break;
        investments_today++;
    }

    let reply = "";

    reply += `Showing stats about ${result.name}\n`;

    reply += "```";
    reply += `Net worth: ${numberWithCommas(result.networth)} M$\n`
    reply += `Average investment profit: ${profitprct.toFixed(2)}%\n`
    reply += `Average last 5 investments profit: ${profitprct_5.toFixed(2)}%\n`
    if (history[0].done === false) {
        reply += `User does have running investment;\n`
        const score = await getScore(history[0].post);
        reply += `Invested at ${history[0].upvotes} upvotes post is now at ${score} upvotes\n`
    }

    const timediff = Math.trunc(((new Date().getTime() / 1000) - history[0].time) / 36e2); // 36e3 will result in hours between date objects
    reply += `Amount of investments last 24 hours: ${investments_today}\n`
    reply += `Last invested: ${timediff} hours ago\n`

    reply += "```";

    msg.channel.send(reply);
}

function numberWithCommas(x: number) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function inactive(msg: Discord.Message, args: string[]) {
    const result = await getUserProfile(msg, args);

    if (result === null) {
        return;
    }

    if (result.firm === 0) {
        msg.reply("I don't think that person is in a firm");
        return;
    }

    const firm = await getFirmProfile(result.firm);
    const firmmembers = await getFirmMembers(result.firm);

    const lastinvestment = [] as { name: string, timediff: number }[];

    for (const member of firmmembers) {
        const history = await getInvestorHistory(member.name, 1);
        if (history[0] !== undefined)
            lastinvestment.push({ name: member.name, timediff: Math.trunc(new Date().getTime() / 1000) - history[0].time });
    }

    lastinvestment.sort((a, b) => b.timediff - a.timediff);

    const listsize = Math.min(10, lastinvestment.length);
    let reply = `Currently ${firm.size} investors in ${firm.name}. Here are the ${listsize} most inactive investors\n` + "```";

    for (let i = 0; i <= listsize; i++) {
        if (lastinvestment[i] === undefined)
            continue;
        const timediff = Math.trunc(lastinvestment[i].timediff / 36e2); // 36e3 will result in hours between date objects
        reply += `${lastinvestment[i].name} last invested: ${timediff} hours ago\n`;
    }

    reply += "```"
    msg.channel.send(reply);
}

async function average_investments(msg: Discord.Message, args: string[]) {
    const profile = await getUserProfile(msg, args);

    if (profile === null) {
        return;
    }

    const days = 7;

    let invest_days = new Map<number, number>();
    const history = await getInvestorHistory(profile.name, days);


    for (const inv of history) {
        const time = new Date(inv.time * 1000);

        if (invest_days.has(time.getDate())) {
            // If this day has already one investment do + 1
            invest_days.set(time.getDate(), invest_days.get(time.getDate()) + 1);
        } else {
            // If no investments on this day set investments to one
            invest_days.set(time.getDate(), 1);
        }
    }

    let total = 0;
    for (const [day, investments] of invest_days) {
        total += investments;
    }
    let avg = total / invest_days.size;

    let reply = "";

    reply += `Showing average investments per day for ${profile.name}\n`;

    reply += "```";
    reply += `Average investments per day: ${avg}\n`
    let maxdays = 4;
    for (const [day, investments] of invest_days) {
        if (maxdays <= 0)
            break;
        reply += `Day [${String(day).padStart(2, '0')}]: ${investments}\n`
        maxdays--;
    }
    reply += "```";

    msg.channel.send(reply);
}

async function firmtop(msg: Discord.Message, args: string[]) {
    const result = await getUserProfile(msg, args);

    if (result === null) {
        return;
    }

    if (result.firm === 0) {
        msg.reply("I don't think that person is in a firm");
        return;
    }

    const firm = await getFirmProfile(result.firm);
    const firm_members = await getFirmMembers(result.firm);

    const members = [] as { name: string, rank: number }[];

    for (const member of firm_members) {
        const profile = await getInvestorProfile(member.name);
        members.push({ name: profile.name, rank: profile.rank });
    }

    members.sort((a, b) => a.rank - b.rank);

    let reply = "";

    reply += `The leaderboard of ${firm.name} is;\n`
    reply += "```";


    for (let i = 0; i < members.length; i++) {
        reply += `${i + 1}. ${members[i].name}\n`
    }
    reply += "```";

    msg.channel.send(reply);
}

async function active(msg: Discord.Message, args: string[]) {
    const profile = await getUserProfile(msg, args);
    const history = await getInvestorHistory(profile.name, 1);

    if (history[0].success === true) {
        msg.reply("You currently don't have any active investments");
        return;
    }

    const investment = getSubmission(history[0].post);

    const timediff = (history[0].time + 14400) - Math.trunc(new Date().getTime() / 1000); // 14400 = 4 hours
    const hours = Math.trunc(timediff / 60 / 60);
    const minutes = Math.trunc(((timediff / 3600) - hours) * 60);

    const investment_return = calculateInvestmentReturn(history[0].upvotes, await investment.score, profile.networth)

    let reply = "";

    reply += "**Upvotes**\n";
    reply += `Inital upvotes: ${history[0].upvotes}\n`;
    reply += `Current upvotes: ${await investment.score}\n\n`;


    reply += "**Time**\n"
    reply += `Maturity in: ${hours}h:${String(minutes).padStart(2, '0')}m\n\n`;

    reply += "**Returns**\n"
    reply += `Invested: ${numberWithCommas(history[0].amount)} M$\n`;
    reply += `Profit: ${numberWithCommas(Math.trunc(investment_return / 100 * history[0].amount))} M$ (${investment_return}%)\n`;
    if (investment_return < 1) {
        const break_even = Math.round(calculateBreakEvenPoint(history[0].upvotes));
        reply += `Break even at ${break_even} upvotes (${break_even - await investment.score} upvotes to go)\n`
    }

    reply += `\n[Link](https://redd.it/${history[0].post})`;

    let data = {} as Discord.RichEmbedOptions;
    data.title = "Your current investment is;"
    data.description = reply;
    data.thumbnail = { url: await investment.thumbnail };
    data.title = await investment.title;
    data.color = 15277667;
    msg.channel.send(new Discord.RichEmbed(data));
}

async function getUserProfile(msg: Discord.Message, args: string[]): Promise<InvestorProfile | null> {
    if (args[1] === undefined) {
        args[1] = await getLink(msg.author.id);
    }


    if (args[1] === undefined) {
        msg.reply("I don't remember your name, and you haven't given me one.\n```Use $setname RedditName to set your name```");
        return null;
    }

    if (args[1].length <= 3) {
        msg.reply("Something tells me that is not a Reddit username");
        return null;
    }

    const result = await getInvestorProfile(args[1]);

    if (result.id === 0) {
        msg.reply("I couldn't find that user. Sorry");
        return null;
    }
    return result;
}

export function startClient() {
    if (getConfig().token === "entertokenhere") {
        console.error("Config not setup! Quitting...");
        process.exit();
    }

    client.login(getConfig().token);
}


startClient();
