// Bot for Blood and Dice
"use strict";
const Discord = require('discord.js');
const db = require("./mongoose-connection.js");
const { Client, Intents } = require('discord.js');

const vg = require("./vampire-game.js")
const mhg = require("./monsterhearts-game.js");
const dwg = require("./dungeonworld-game.js");
const cg = require("./changeling-game.js");
const ttg = require("./tangled-game.js");
const pbtag = require("./generic-pbta.js");
const dfg= require("./dfrpg-game.js");
const rootgame = require("./root-game.js");

const DB_URI = process.env.BD_DBURI;
console.log(`Prefix is ${process.env.BD_PREFIX}`);
const PREFIX = process.env.BD_PREFIX;
const TOKEN = process.env.BD_TOKEN;

const client = new Client({intents: ["DIRECT_MESSAGES","GUILD_MESSAGES", Intents.FLAGS.GUILDS]});

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity(`Rolling Dice`);
});


client.on('message', async msg => {
	console.log(`Received message: ${msg.content}`);
	console.log(msg);

	// Ignore bots
	if (msg.author.bot) return;

	let game = null;

	console.log(`Looking up ${msg.channel.guild.id} guild in ${msg.channel.id} channel...`);
	let gameState = await db.getGame(DB_URI, msg.channel.guild.id, msg.channel.id);

	switch (gameState.system) {
		case 'Requiem':
			console.log("Playing Vampire");
			game = vg.VampireGame(gameState);
			break;
		case 'Monsterhearts':
			console.log("Playing Monsterhearts");
			game = mhg.MonsterheartsGame(gameState);
			break;
		case 'Dungeon World':
			console.log("Playing Dungeon World");
			game = dwg.DungeonWorldGame(gameState);
			break;
		case 'Changeling: the Lost':
			console.log("Playing Changeling");
			game = cg.ChangelingGame(gameState);
			console.log("Done creating game");
			break;
		case 'Tangled Threads':
			console.log("Playing Tangled Threads");
			game = ttg.TangledThreadsGame(gameState);
			break;
		case 'MotW':
			console.log("Playing Monster of the Week");
			game = pbtag.PbtAGame(gameState);
			break;
		case 'DFRPG':
			console.log("Playing DFRPG");
			game = dfg.DFGame(gameState);
			break;
		case 'Root':
			console.log("Playing Root");
			game = rootgame.RootGame(gameState);
			break;
		default:
			console.log("Playing DFRPG");
			game = dfg.DFGame(gameState);
			break;
	}

	console.log(`About to check to see if message starts with prefix: ${msg.content} \n PREFIX:  ${PREFIX}`);
	// Ignore anything that doesn't start with our prefix
	if (msg.content.indexOf(PREFIX) !== 0) return;

	console.log("About to get character");
	let userId = msg.member.id;
	let character = gameState.characters.get(userId);

	console.log("About to grab channel");
	// Grab the channel we'll send messages to
	let msgDest = msg.channel;

	// Seperate off the command
	const args = msg.content.slice(PREFIX.length).trim().split(/ +/g);
	let command = args.shift().toLowerCase();
	if (command == "dm") {
		msgDest = msg.author;
		command = args.shift().toLowerCase();
	}

	console.log('Command is' + command);

	switch (command) {
		case 'ping':
			msg.reply('pong');
			break;
		case 'about':
			msg.reply(`I'm a die rolling and card drawing bot. In this channel, I'm running the game ${gameState.name} using the system ${gameState.system}. Type '/help' to learn about my commands.`);
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
			console.log("Default");
			if (game.hasCommand(command)) {
				console.log("Has command");
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



