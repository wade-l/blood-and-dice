const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require ("./config.json");
const roller = require("./roller.js");

bot.on('ready', () => {
	console.log(`Logged in as ${bot.user.tag}!`);
	bot.user.setActivity(`Ready to Roll`);
});

bot.on('message', async msg => {
	// Ignore bots
	if (msg.author.bot) return;

	// Ignore anything that doesn't start with our prefix
	if (msg.content.indexOf(config.prefix) !== 0) return;

	// Seperate off the command
	const args = msg.content.slice(config.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	switch (command) {
		case 'ping':
			msg.reply('pong');
			break;
		case 'roll':
			roll = roller.rollPool(args.shift());
			console.log(roll);
			msg.reply(`rolled ${roll.text} for ${roll.successes} successes`);
			break;
		default:
			msg.reply('Here would go help');
	}

});

bot.login(config.token);
