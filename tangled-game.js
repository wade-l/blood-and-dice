"use strict";
const roller = require("./roller.js");
const ttk = require("./tangled-keeper.js");

function TangledThreadsGame(gameState) {

	let sheetId = gameState.sheet;

	return {
		"keeper": ttk.TangledThreadsKeeper(sheetId, process.env.BD_GOOGLECREDENTIALS),
		"commands": ['draw','d','hinder','h','bolster','b','combo','c','sheet','help'],
		"hasCommand": function (command) {
			return this.commands.includes(command);
		},
		"doCommand": async function(command, context) {
			
			if (context.character === undefined) {
				msg.reply("sorry, you don't appear to have a character assigned to you.");
				return;
			}

			let character = context.character;
			let id = character.source;
			let args = context.args;
			let msgDest = context.msgDest;
			let msg = context.msg;
			let keeper = this.keeper;
			switch (command) {
				case 'd':
				case 'draw': {
					try {
						let rollText = await keeper.roll(args.join(" ").toLowerCase(),id);
						msgDest.send(`${msg.member} drew ${rollText}`);
					} catch (err) {
						msg.reply(`Sorry, your draw encountered a problem (${err})`);
					}
					break;
				}
				case 'b':
				case 'bolster': {
					try {
						let rollText = await keeper.roll(args.join(" ").toLowerCase(),id, true, false);
						msgDest.send(`${msg.member} drew ${rollText}`);
					} catch (err) {
						msg.reply(`Sorry, your draw encountered a problem (${err})`);
					}
					break;
				}
				case 'h':
				case 'hinder': {
					try {
						let rollText = await keeper.roll(args.join(" ").toLowerCase(),id, false, true);
						msgDest.send(`${msg.member} drew ${rollText}`);
					} catch (err) {
						msg.reply(`Sorry, your draw encountered a problem (${err})`);
					}
					break;
				}
				case 'c':
				case 'combo': {
					try {
						let rollText = await keeper.roll(args.join(" ").toLowerCase(),id, true, true);
						msgDest.send(`${msg.member} drew ${rollText}`);
					} catch (err) {
						msg.reply(`Sorry, your draw encountered a problem (${err})`);
					}
					break;
				}
				case 'sheet': {
					let sheet = await keeper.getSheet(id);
					console.log("Sheet:");
					console.log(sheet);
					let sheetMessage = `Character Sheet for ${sheet.characterName} pulled from GoogleDocs:\r`;
					sheetMessage += sheet.getFormattedSheet();
					msg.reply("I've tried to DM you a copy of your character sheet.");
					msg.author.send(sheetMessage);
					break;
				}
				default:
					break;
				
			}
		},
		"getHelp": function() {
			let help = "Commands:\r";
			help += "```fix\r";
			help += "/draw <number or skill>\t\tDo a regular draw of that many cards\r";
			help += "/d <number or skill>\t\t\tShort for draw\r";
			help += "/bolster <number or skill>\t\tDo a bolstered draw of that many cards\r";
			help += "/b <number or skill>\t\t\tShort for bolster\r";
			help += "/hinder <number or skill>\t\tDo a hindered draw of that many cards\r";
			help += "/h <number or skill>\t\t\tShort for hinder\r";
			help += "/combo <number or skill>\t\tDo a both bolstered and hindered draw of that many cards\r";
			help += "/c <number or skill>\t\t\tShort for combo\r";
			help += "/sheet\t\tDM you your character sheet\r";
			help += "(if /sheet says you have no character assigned, it just means Wade hasn't entered the stats yet. He's working on it!)";
			help += "\r\rAt this moment the bot does not allow you to subtract luck points, do twists, add wounds or the like automatically. Tag Wade and he'll adjust your sheet for you if needed.\r"

			help += "```";
			return help;
		}
	}
}

exports.TangledThreadsGame = TangledThreadsGame;



// "Helper" functions
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