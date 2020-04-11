// Bot for Blood and Dice
"use strict";
const Discord = require('discord.js');
const client = new Discord.Client();
const config = require ("./config.json");
const roller = require("./roller.js");
const storage = require('node-persist');

// For Google API

//const {google} = require('googleapis');
const {google} = require('googleapis');
const credentials = require("./credentials.json");
const gconn = require("./googleconnection.js");
const sheetId = '1OeSRHL38EheCYsdHpxX04cI5ghHqYeIf2u43hERyYI8';

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

			let roll = roller.rollPool(args.shift());
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
		case 'sheet':
			if (characters[userId] != undefined)
			{

				let characterData = await getSheetData(character.characterName);
				console.log(characterData);
				let sheet = parseSheet(characterData);
				let sheetMessage = `Character Sheet for ${sheet.characterName} pulled from GoogleDocs\r`;
				sheetMessage += "```fix\r";
				sheetMessage += `Character: \t ${sheet.characterName}\tPlayer: \t${sheet.playerName}\r`;
				sheetMessage += `Vitae: \t\t ${sheet.vitae} / ${sheet.maxVitae}\r`;
				sheetMessage += `Willpower: \t ${sheet.willpower} / ${sheet.maxWillpower}\r`;
				sheetMessage += `Beats: \t\t ${sheet.beats} \t Experiences: ${sheet.experiences}\r`;
				sheetMessage += "```\r";
				msg.reply(sheetMessage);
			} else {
				msg.reply("sorry, you don't appear to have a character assigned to you.");
			}
			break;
		case 'asp':
		case 'aspirations':
			if (characters[userId] != undefined) {
				let characterData = await getSheetData(character.characterName);
				let sheet = parseSheet(characterData);
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
				let characterData = await getSheetData(character.characterName);
				let sheet = parseSheet(characterData);
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

			let characterData = await getSheetData(character.characterName);
			console.log(characterData);
			let sheet = parseSheet(characterData);

			let adjustment = args.shift().toLowerCase();
			if (characters[userId] == undefined) {
				msg.reply("sorry, you don't appear to have a character assigned to you.");
			} if (adjustment.charAt(0) == '+') {
				adjustment = adjustment.slice(1);
				sheet[command] += parseInt(adjustment);
				setSheetValue(character.characterName,command, sheet[command]);
				msg.reply(`you added ${adjustment} to your ${command} (new amount: ${sheet[command]}).\r`);
			} else if (adjustment.charAt(0) == '-') {
				adjustment = adjustment.slice(1);
				sheet[command] -= parseInt(adjustment);
				setSheetValue(character.characterName,command, sheet[command]);
				msg.reply(`you removed ${adjustment} from your ${command} (new amount: ${sheet[command]}).\r`);
			} else if ( Number.isInteger(parseInt(adjustment))) {
				sheet[command] = parseInt(adjustment);
				setSheetValue(character.characterName,command, sheet[command]);
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

async function getSheetData(characterName) {
	let auth = await gconn.getAuth(credentials);
	const sheets = google.sheets({version: 'v4', auth});
  	let characters =[];
  	let res = await sheets.spreadsheets.values.get({
    	spreadsheetId: sheetId,
    	range: `${characterName}!A1:K50`,
 	});
 	let rows = res.data.values;
	return rows;
}

async function setSheetValue(characterName, stat, value) {
	let auth = await gconn.getAuth(credentials);
	const sheets = google.sheets({version: 'v4', auth});

	let cellId = 'I1';
	switch (stat) {
		case 'vitae':
			cellId = 'H24';
			break;
		case 'willpower':
			cellId = 'H22';
			break;
		case 'beats':
			cellId = 'H31';
			break;
		case 'experiences':
			cellId = 'H30';
			break;
	}
	let range = `${characterName}!${cellId}:${cellId}`;
	let body = { values: [
			[ value ]
		]
	};
	sheets.spreadsheets.values.update({
		spreadsheetId: sheetId,
		range: range,
		valueInputOption: 'RAW',
		resource: body

	}).then((response) => {
		console.log(`${response.data.updatedCells} cells updated.`);
	});
}

function parseSheet(data) {
	let sheet = {};
	sheet.characterName = data[0][1];
	sheet.playerName = data[0][4];
	sheet.vitae = parseInt(data[23][7]);
	sheet.maxVitae = parseInt(data[23][9]);
	sheet.willpower = parseInt(data[21][7]);
	sheet.maxWillpower = parseInt(data[21][9]);
	sheet.experiences = parseInt(data[29][7]);
	sheet.beats = parseInt(data[30][7]);
	sheet.aspirations = [ data[1][9], data[2][9], data[3][9]];
	sheet.conditions = [];
	let conditionName = undefined;
	let conditionText = undefined;
	let moreConditions = true;
	let cIndex = 6;
	while (moreConditions) {
		conditionName = data[cIndex][9];
		conditionText = data[cIndex][10];
		if (typeof conditionName === "undefined") {
			moreConditions = false;
		} else {
			sheet.conditions.push({
				name: conditionName,
				text: conditionText
			});
		}
		cIndex++;
	}
	console.log(sheet.conditions);

	return sheet;

}

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
