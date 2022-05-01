"use strict";
const roller = require("./roller.js");
//const mhk = require("./monsterhearts-keeper.js");

function RootGame(gameState) {

	let sheetId = gameState.sheet;

	return {
		//"keeper": mhk.MonsterHeartsKeeper(sheetId, process.env.BD_GOOGLECREDENTIALS),
		"commands": ['roll','r'],//oll8','roll9','sheet','stats','stat','asp','aspirations','conditions','vitae','health','willpower','beats','experiences'],
		"hasCommand": function (command) {
			return this.commands.includes(command);
		},
		"doCommand": async function(command, context) {
			
			let args = context.args;
			let msgDest = context.msgDest;
			let msg = context.msg;
			let keeper = this.keeper;

			/*if (context.character === undefined) {
				msg.reply("sorry, you don't appear to have a character assigned to you.");
				return;
			}

			let character = context.character;
			let id = character.source;*/

			switch (command) {
				case 'r':
				case 'roll': {
					try {
						//let rollText = await keeper.roll(args.join(" ").toLowerCase(),id);
						let rollText = roller.pbtaRoll(0);
						console.log(rollText);
						msgDest.send(`${msg.member} rolled ${rollText.dice} totalling ${rollText.total}`);
					} catch (err) {
						msg.reply(`Sorry, your roll encountered a problem (${err})`);
					}
					break;
				}
				/*case 'sheet': {
					let sheet = await keeper.getSheet(id);
					console.log("Sheet:");
					console.log(sheet);
					let sheetMessage = `Character Sheet for ${sheet.characterName} pulled from GoogleDocs:\r`;
					sheetMessage += sheet.getFormattedSheet();
					msgDest.send(sheetMessage);
					break;
				}
				case 'stats': {
					let sheet = await keeper.getSheet(id);
					let sheetMessage = `Statblock for ${sheet.characterName}:\r`;
					sheetMessage += sheet.getFormattedStatBlock();
					msgDest.send(sheetMessage);
					break;
				}
				case 'stat': {
					let sheet = await keeper.getSheet(id);
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
					let sheet = await keeper.getSheet(id);
					let aspirationsText = formatAspirations(sheet);
					let replyText = `Aspirations for ${sheet.characterName}:\r`;
					replyText += "```fix\r";
					replyText += `${aspirationsText}`;
					replyText +="```\r";
					msgDest.send(replyText);
					break;
				}
				case 'conditions': {
					let sheet = await keeper.getSheet(id);
					let conditionsText = formatConditions(sheet);
					let replyText = `Conditions for ${sheet.characterName}:\r`;
					replyText += "```fix\r";
					replyText += `${conditionsText}`;
					replyText +="```\r";
					msgDest.send(replyText);
					break;
				}*/
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

exports.RootGame = RootGame;