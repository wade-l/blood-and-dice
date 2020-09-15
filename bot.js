// Bot for Blood and Dice
"use strict";
const Discord = require('discord.js');
const db = require("./mongoose-connection.js");
const client = new Discord.Client();
const vg = require("./vampire-game.js")
const mhg = require("./monsterhearts-game.js");
const dwg = require("./dungeonworld-game.js");
const cg = require("./changeling-game.js");

const DB_URI = process.env.BD_DBURI;
const PREFIX = process.env.BD_PREFIX;
const TOKEN = process.env.BD_TOKEN;

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity(`Vampire: the Requiem`);
});

client.on('message', async msg => {
	console.log(`Received message: ${msg.content}`);

	// Ignore bots
	if (msg.author.bot) return;

	let game = null;

	console.log(`Looking up ${msg.channel.guild.id} guild in ${msg.channel.id} channel...`);
	let gameState = await db.getGame(DB_URI, msg.channel.guild.id, msg.channel.id);

	console.log(gameState);

	switch (msg.channel.guild.id) {
		case '691158656951123980':
			console.log("Playing Vampire");
			game = vg.VampireGame();
			break;
		case '690990507085791242':
			console.log("Playing Monsterhearts");
			game = mhg.MonsterheartsGame();
			break;
		case '691864914532368404':
			console.log("Playing Dungeon World");
			game = dwg.DungeonWorldGame();
			break;
		case '747476140012077147':
			console.log("Playing Changeling");
			game = cg.ChangelingGame();
			break;
	}

	// Ignore anything that doesn't start with our prefix
	if (msg.content.indexOf(PREFIX) !== 0) return;

	let userId = msg.member.id;
	let character = gameState.characters.get(userId);

	// Grab the channel we'll send messages to
	let msgDest = msg.channel;

	// Seperate off the command
	const args = msg.content.slice(PREFIX.length).trim().split(/ +/g);
	let command = args.shift().toLowerCase();
	if (command == "dm") {
		msgDest = msg.author;
		command = args.shift().toLowerCase();
	}

	switch (command) {
		case 'ping':
			msg.reply('pong');
			break;
		case 'assign':
			console.log("Attempting to assign character to player");

			if (msg.member.roles.cache.some(role => role.name === "Storyteller")) {
				let player = args.shift().toLowerCase();
				let user = msg.mentions.users.first();
				console.log(msg.mentions.users.first());
				if (user != undefined) {
					let character = args.shift().toLowerCase();
					gameState.characters.set(user.id,{source: character, name: character});
					gameState.save();
					msg.reply(`Assigned ${character} to ${user}`);
				} else {
					msg.reply("We can't find the user you were trying to assign.");
				}
			} else {
				msg.reply("You don't have permission to assign someone a character.");
			}
			break;
		case 'roster':
			console.log("Attempting to list all characters");
			let rosterString = "here is which character is assigned to which Discord id:\r";
			const iterator = gameState.characters.keys();

			for (const id of gameState.characters.keys()) {
				let character = gameState.characters.get(id);
				rosterString += `${character.name} (${character.source}) is assigned to userId ${id}\r`;
			}

			msg.reply(rosterString);
			break;
		case 'help':
			msg.reply(game.getHelp());
		default:
			if (game.hasCommand(command)) {
				let context = {
					"character": character,
					"msgDest": msgDest,
					"msg": msg,
					"args": args
				}
				game.doCommand(command,context);
			} else {
				msg.reply("Sorry, that command isn't recognized.\r" + game.getHelp());
			}

	}

});

client.login(TOKEN);



