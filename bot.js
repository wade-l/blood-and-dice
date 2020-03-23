const Discord = require('discord.js');
const client = new Discord.Client();
const config = require ("./config.json");
const roller = require("./roller.js");
const storage = require('node-persist');

storage.init();


client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity(`Vampire: the Requiem`);
});

client.on('message', async msg => {
	console.log(`Recieved message: ${msg.content}`);
	// Ignore bots
	if (msg.author.bot) return;

	// Ignore anything that doesn't start with our prefix
	if (msg.content.indexOf(config.prefix) !== 0) return;

	let rolls = await storage.getItem('rolls');
	if (rolls == undefined) rolls = [];
	let characters = await storage.getItem('characters');
	if (characters == undefined) characters = {};
	let users = await storage.getItem('users');
	if (users == undefined) users = {};
	console.log(characters);

	let userId = msg.member.id;
	let character = characters[userId];


	// Seperate off the command
	const args = msg.content.slice(config.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	switch (command) {
		case 'ping':
			msg.reply('pong');
			break;
		case 'roll':

			roll = roller.rollPool(args.shift());
			rolls.push(roll);

			console.log(roll);
			let remainder = args.join(" ");
			if (remainder.length > 0) {
				remainder = "(" + remainder + ")";
			} else {
				remainder = "";
			}
			msg.channel.send(`${msg.member} rolled ${roll.dice} dice, which came up ${roll.text} for ${roll.successes} successes ${remainder}`);

			break;
		case 'history':
			msg.channel.send(rolls);
			break;
		case 'assign':
			console.log("Attempting to assign character to player");

			if (msg.member.roles.cache.some(role => role.name === "Storyteller")) {
				let player = args.shift().toLowerCase();
				let user = msg.mentions.users.first();
				console.log(msg.mentions.users.first());
				if (user != undefined) {
					let character = args.shift().toLowerCase();
					characters[user.id] = {
						"characterName" : character,
						"vitae"	: 0,
						"health" : 0,
						"willpower" : 0,
						"beats" : 0,
						"experiences" : 0
					};
				} else {
					msg.reply("We can't find the user you were trying to assign.");
				}
			} else {
				msg.reply("You don't have permission to assign someone a character.");
			}
			break;
		case 'roster':
			console.log("Attempting to list all characters");
			let rosterString = "";
			for (var key in characters) {
				user = await client.users.fetch(key);
				rosterString += `${user} is playing ${characters[key].characterName}.\r`;
				console.log(user);
				console.log(key);
				console.log(characters[key]);
			}

			msg.reply(rosterString);
			break;
		case 'sheet':
			if (characters[userId] != undefined)
			{
				let sheetMessage = "here's your character sheet:\r";
				sheetMessage += `Character: ${character.characterName}\r`;
				sheetMessage += `Vitae: ${character.vitae}\r`;
				sheetMessage += `Willpower: ${character.willpower}\r`;
				sheetMessage += `Beats: ${character.beats}\r`;
				sheetMessage += `Experiences: ${character.experiences}\r`;
				msg.reply(sheetMessage);
			} else {
				msg.reply("sorry, you don't appear to have a character assigned to you.");
			}
			break;
		case 'vitae':
		case 'health':
		case 'willpower':
		case 'beats':
		case 'experiences':
			console.log(`Trying to adjust ${command}`);
			let adjustment = args.shift().toLowerCase();
			if (characters[userId] == undefined) {
				msg.reply("sorry, you don't appear to have a character assigned to you.");
			} if (adjustment.charAt(0) == '+') {
				adjustment = adjustment.slice(1);
				characters[userId][command] += parseInt(adjustment);
				msg.reply(`you added ${adjustment} to your ${command}.\r`);
			} else if (adjustment.charAt(0) == '-') {
				adjustment = adjustment.slice(1);
				characters[userId][command] -= parseInt(adjustment);
				msg.reply(`you removed ${adjustment} from your ${command}.\r`);
			} else if ( Number.isInteger(parseInt(adjustment))) {
				msg.reply(`you set your ${command} to ${adjustment}\r`);
				characters[userId][command] = parseInt(adjustment);
			} else {
				msg.reply("I don't know what you were trying to do.");
			}

			break;
		case 'help':
		default:
			help = "Commands:\r";
			help += "/roll <X> \t\t Roll <X> dice\r";
			help += "/sheet\t\tSee your character sheet\r";
			help += "/vitae/willpower/health/experience/beats <X>\t\t Sets that stat to <X>\r";
			help += "/vitae/willpower/health/experience/beats +<X>\t\t Adds <X> to the stat.\r";
			help += "/vitae/willpower/health/experience/beats -<X>\t\t Subtracts <X> from the stat.\r";
			msg.reply(help);
	}

	storage.set('rolls',rolls);
	storage.set('characters', characters);
	storage.set('users', users);

});

client.login(config.token);
