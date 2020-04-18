// Bot for Blood and Dice
"use strict";
const Discord = require('discord.js');
const client = new Discord.Client();
const config = require ("./config.json");
const roller = require("./roller.js");
const storage = require('node-persist');
//const vk = require("./vampire-keeper.js");
const mhk = require("./monsterhearts-keeper.js");

// For Google API
const {google} = require('googleapis');
const gconn = require("./googleconnection.js");


//const {google} = require('googleapis');

storage.init();

//let keeper = vk.VampireKeeper('1OeSRHL38EheCYsdHpxX04cI5ghHqYeIf2u43hERyYI8', require("./credentials.json"));
let keeper = mhk.MonsterHeartsKeeper('1jU_yUyURD6bIndIKyeZJb-vsnoY20M1kuOAD0GhY5xc', require("./credentials.json"));

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity(`Botting`);
});

client.on('message', async msg => {
	console.log(`Recieved message: ${msg.content}`);
	// Ignore bots
	if (msg.author.bot) {
		console.log(msg.embeds[0]);
		return;
	}

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


	// Seperate off the command
	const args = msg.content.slice(config.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	switch (command) {
		case 'ping':
			msg.reply('pong');
			break;
		case 'roll':
			if (characters[userId] != undefined)
			{
				let rollText = await keeper.roll(args.join(" ").toLowerCase(),character.characterName);
				msg.channel.send(`${msg.member} rolled ${rollText}`);

			} else {
				msg.reply("sorry, you don't appear to have a character assigned to you.");
			}
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
						"characterName" : character
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
				let user = await client.users.fetch(key);
				if (typeof user != 'undefined') {
					rosterString += `${user} is playing ${characters[key].characterName}.\r`;
					console.log(user);
					console.log(key);
					console.log(characters[key]);
				}
			}

			msg.reply(rosterString);
			break;
		case 'sheet':
			if (characters[userId] != undefined)
			{
				let sheet = await keeper.getSheet(character.characterName);
				console.log("Sheet:");
				console.log(sheet);
				let sheetMessage = `Character Sheet for ${sheet.characterName} pulled from GoogleDocs:\r`;
				sheetMessage += sheet.getFormattedSheet();
				msg.channel.send(sheetMessage);
			} else {
				msg.reply("sorry, you don't appear to have a character assigned to you.");
			}
			break;
		case 'stats':
			if (characters[userId] != undefined)
			{
				let sheet = await keeper.getSheet(character.characterName);
				console.log("Sheet:");
				console.log(sheet);
				let sheetMessage = `Statblock for ${sheet.characterName}:\r`;
				sheetMessage += sheet.getFormattedStatBlock();
				msg.reply(sheetMessage);
			} else {
				msg.reply("sorry, you don't appear to have a character assigned to you.");
			}
			break;
		case 'stat':
			if (characters[userId] != undefined)
			{
				let sheet = await keeper.getSheet(character.characterName);
				try {
					let stat = sheet.getStat(args.shift().toLowerCase());
					msg.reply(`Your ${stat.name} is ${stat.value}.`);
				} catch (e) {
					console.log("getStat error:");
					console.log(e);
					msg.reply("Couldn't unambigiously find a stat of that name. Maybe check your spelling or make it less ambigious?");
				}
			} else {
				msg.reply("sorry, you don't appear to have a character assigned to you.");
			}
			break;
		case 'asp':
		case 'aspirations':
			if (characters[userId] != undefined) {
				let sheet = keeper.getSheet(character.characterName);
				let aspirationsText = formatAspirations(sheet);
				let replyText = `Aspirations for ${sheet.characterName}:\r`;
				replyText += "```fix\r";
				replyText += `${aspirationsText}`;
				replyText +="```\r";
				msg.reply(replyText);
			} else {
				msg.reply("sorry, you don't appear to have a character assigned to you.");
			}
			break;
		case 'conditions':
			if (characters[userId] != undefined) {
				let sheet = keeper.getSheet(character.characterName);
				let conditionsText = formatConditions(sheet);
				let replyText = `Conditions for ${sheet.characterName}:\r`;
				replyText += "```fix\r";
				replyText += `${conditionsText}`;
				replyText +="```\r";
				msg.reply(replyText);
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

			let sheet = await keeper.getSheet(character.characterName);

			let adjustment = args.shift().toLowerCase();
			if (characters[userId] == undefined) {
				msg.reply("sorry, you don't appear to have a character assigned to you.");
			} if (adjustment.charAt(0) == '+') {
				adjustment = adjustment.slice(1);
				sheet[command] += parseInt(adjustment);
				keeper.setStat(character.characterName,command,sheet[command]);
				msg.reply(`you added ${adjustment} to your ${command} (new amount: ${sheet[command]}).\r`);
			} else if (adjustment.charAt(0) == '-') {
				adjustment = adjustment.slice(1);
				sheet[command] -= parseInt(adjustment);
				keeper.setStat(character.characterName,command,sheet[command]);
				msg.reply(`you removed ${adjustment} from your ${command} (new amount: ${sheet[command]}).\r`);
			} else if ( Number.isInteger(parseInt(adjustment))) {
				sheet[command] = parseInt(adjustment);
				keeper.setStat(character.characterName,command,sheet[command]);
				msg.reply(`you set your ${command} to ${adjustment}\r`);
			} else {
				msg.reply("I don't know what you were trying to do.");
			}

			break;
		case 'help':
		default:
			let help = "Commands:\r";
			help += "```fix\r";
			help += "/aspirations\t\tSee your aspirations\r";
			help += "/asp\t\tSee your aspirations\r";
			help += "/conditions\t\tSee your conditions\r";
			help += "/roll <X> \t\t Roll <X> dice\r";
			help += "/sheet\t\tSee your character sheet\r";
			help += "/stats\t\tSee brief character stats\r";
			help += "/vitae/willpower/experience/beats <X>\t\t Sets that stat to <X>\r";
			help += "/vitae/willpower/experience/beats +<X>\t\t Adds <X> to the stat.\r";
			help += "/vitae/willpower/experience/beats -<X>\t\t Subtracts <X> from the stat.\r";
			help += "```";
			msg.reply(help);
	}

	storage.set('rolls',rolls);
	storage.set('characters', characters);
	storage.set('users', users);

});

client.login(config.token);


function formatAspirations(sheet) {
	let index = 0;
	let formattedAspirations = "";
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
