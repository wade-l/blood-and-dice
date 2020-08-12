// Bot for Blood and Dice
"use strict";
const Discord = require('discord.js');
const client = new Discord.Client();
const config = require ("./vampire-config.json");
const roller = require("./roller.js");
const storage = require('node-persist');
const vg = require("./vampire-game.js")

storage.init();

let game = vg.VampireGame();

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity(`Vampire: the Requiem`);
});

client.on('message', async msg => {
	console.log(`Received message: ${msg.content}`);
	// Ignore bots
	if (msg.author.bot) return;

	// Ignore anything that doesn't start with our prefix
	if (msg.content.indexOf(config.prefix) !== 0) return;
	let rolls = [];
	let characters = {};
	let users ={};

	try {
		rolls = await storage.getItem('rolls');
		if (typeof rolls === "undefined") rolls =[];
		characters = await storage.getItem('characters');
		if (typeof characters === "undefined") characters = {};
		users = await storage.getItem('users');
		if (typeof users === "undefined") users = {};
	} catch (err) {
		console.log("Error reading storage");
		console.log(err)
	}
	console.log(characters);

	let userId = msg.member.id;
	let character = {};
	if (! (typeof characters === "undefined") ) {
		character = characters[userId];
	}

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
					characters[user.id] = {
						"characterName" : character,
						"vitae"	: 0,
						"health" : 0,
						"willpower" : 0,
						"beats" : 0,
						"experiences" : 0
					};
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
		case 'help':
			msg.reply(game.getHelp());
		default:
			if (game.hasCommand(command)) {
				let context = {
					"character": characters[userId],
					"msgDest": msgDest,
					"msg": msg,
					"args": args
				}
				game.doCommand(command,context);
			} else {
				msg.reply("Sorry, that command isn't recognized.\r" + game.getHelp());
			}

	}

	storage.set('rolls',rolls);
	storage.set('characters', characters);
	storage.set('users', users);

});

client.login(config.token);


function formatAspirations(sheet) {
	let index = 0;
	let formattedAspirations = "";
	console.log(sheet);
	while (index < sheet.aspirations.length) {
		formattedAspirations += sheet.aspirations[index];
		formattedAspirations += "\r";
		index++;
	}

	return formattedAspirations;
}

function formatConditions(sheet) {
	let index = 0;
	let formattedConditions = "";
	while (index < sheet.conditions.length) {
		formattedConditions += `** ${sheet.conditions[index].name} **\r`;
		formattedConditions += sheet.conditions[index].text;
		formattedConditions += "\r";

		index++;
	}

	return formattedConditions;
}
