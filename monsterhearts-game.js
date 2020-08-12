"use strict";
const config = require ("./vampire-config.json");
const roller = require("./monsterhearts-roller.js");
const mhk = require("./monsterhearts-keeper.js");

function MonsterheartsGame() {

	return {
		"keeper": mhk.MonsterHeartsKeeper('1jU_yUyURD6bIndIKyeZJb-vsnoY20M1kuOAD0GhY5xc', require("./credentials.json")),
		"commands": ['roll','roll8','roll9','sheet','stats','stat','asp','aspirations','conditions','vitae','health','willpower','beats','experiences'],
		"hasCommand": function (command) {
			return this.commands.includes(command);
		},
		"doCommand": async function(command, context) {
			
			if (context.character === undefined) {
				msg.reply("sorry, you don't appear to have a character assigned to you.");
				return;
			}

			let character = context.character;
			let args = context.args;
			let msgDest = context.msgDest;
			let msg = context.msg;
			let keeper = this.keeper;
			switch (command) {
				case 'roll': {
					try {
						let rollText = await keeper.roll(args.join(" ").toLowerCase(),character.characterName);
						msgDest.send(`${msg.member} rolled ${rollText}`);
					} catch (err) {
						msg.reply(`Sorry, your roll encountered a problem (${err})`);
					}
					break;
				}
				case 'sheet': {
					let sheet = await keeper.getSheet(character.characterName);
					console.log("Sheet:");
					console.log(sheet);
					let sheetMessage = `Character Sheet for ${sheet.characterName} pulled from GoogleDocs:\r`;
					sheetMessage += sheet.getFormattedSheet();
					msgDest.send(sheetMessage);
					break;
				}
				case 'stats': {
					let sheet = await keeper.getSheet(character.characterName);
					let sheetMessage = `Statblock for ${sheet.characterName}:\r`;
					sheetMessage += sheet.getFormattedStatBlock();
					msgDest.send(sheetMessage);
					break;
				}
				case 'stat': {
					let sheet = await keeper.getSheet(character.characterName);
					try {
						let stat = sheet.getStat(args.shift().toLowerCase());
						msg.reply(`Your ${stat.name} is ${stat.value}.`);
					} catch (e) {
						console.log("getStat error:");
						console.log(e);
						msg.reply("Couldn't unambigiously find a stat of that name. Maybe check your spelling or make it less ambigious?");
					}
					break;
				}
				case 'asp':
				case 'aspirations': {
					let sheet = await keeper.getSheet(character.characterName);
					let aspirationsText = formatAspirations(sheet);
					let replyText = `Aspirations for ${sheet.characterName}:\r`;
					replyText += "```fix\r";
					replyText += `${aspirationsText}`;
					replyText +="```\r";
					msgDest.send(replyText);
					break;
				}
				case 'conditions': {
					let sheet = await keeper.getSheet(character.characterName);
					let conditionsText = formatConditions(sheet);
					let replyText = `Conditions for ${sheet.characterName}:\r`;
					replyText += "```fix\r";
					replyText += `${conditionsText}`;
					replyText +="```\r";
					msgDest.send(replyText);
					break;
				}
				default:
					break;
				
			}
		},
		"getHelp": function() {
			let help = "Commands:\r";
			help += "```fix\r";
			help += "/dm <aspirations/conditions/sheet>\tSend you the information via DM\r";
			help += "/roll <X> \t\t Roll <X> dice\r";
			help += "/sheet\t\tSee your character sheet\r";
			help += "/stats\t\tSee brief character stats\r";
			help += "```";
			return help;
		}
	}
}

exports.MonsterheartsGame = MonsterheartsGame;