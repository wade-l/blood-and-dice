// Bot for Blood and Dice
"use strict";
const Discord = require('discord.js');
const db = require("./mongoose-connection.js");
const client = new Discord.Client();
const config = require ("./config.json");
const vg = require("./vampire-game.js")
const mhg = require("./monsterhearts-game.js");
const dwg = require("./dungeonworld-game.js");

let game = vg.VampireGame();

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity(`Vampire: the Requiem`);
});

client.on('message', async msg => {
	console.log(`Received message: ${msg.content}`);

	// Ignore bots
	if (msg.author.bot) return;

	let gameState = await db.getGame(config.mongoconnectionstring, msg.channel.guild.id, msg.channel.id);

	switch (msg.channel.guild.id) {
		case '691158656951123980':
			game = vg.VampireGame();
			break;
		case '690990507085791242':
			game = mhg.MonsterheartsGame();
			break;
		case '691864914532368404':
			game = dwg.DungeonWorldGame();
			break;
	}

	// Ignore anything that doesn't start with our prefix
	if (msg.content.indexOf(config.prefix) !== 0) return;

	let userId = msg.member.id;
	let character = gameState.characters.get(userId);

	// Grab the channel we'll send messages to
	let msgDest = msg.channel;

	// Seperate off the command
	const args = msg.content.slice(config.prefix.length).trim().split(/ +/g);
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

client.login(config.token);



