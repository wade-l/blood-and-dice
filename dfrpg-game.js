"use strict";
const roller = require("./roller.js");
const dfk = require("./dfrpg-keeper.js");

function DFGame(gameState) {

	let sheetId = gameState.sheet;

	return {
		"keeper": dfk.DFKeeper(sheetId, process.env.BD_GOOGLECREDENTIALS),
		"commands": ['roll','r'],
		"hasCommand": function (command) {
			return this.commands.includes(command);
		},
		"doCommand": async function(command, context) {
			
			//if (context.character === undefined) {
			//	context.msg.reply("sorry, you don't appear to have a character assigned to you.");
			//	return;
			//}

			console.log("DoCommand");

			let character = context.character;
			//let id = character.source;
			let id = 0;
			let args = context.args;
			let msgDest = context.msgDest;
			let msg = context.msg;
			let keeper = this.keeper;
			console.log("Command is " + command);
			switch (command) {
				case 'r':
				case 'roll': {
					try {
						let rollText = await keeper.roll(args.join(" ").toLowerCase(),id);
						msgDest.send(`${msg.member} rolled ${rollText}`);
					} catch (err) {
						msg.reply(`Sorry, your roll encountered a problem (${err})`);
					}
					break;
				}
				case 'sheet': {
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
				default:
					break;
				
			}
		},
		"getHelp": function() {
			let help = "Commands:\r";
			help += "```fix\r";
			help += "/roll\t\t Roll Fate dice\r";
			help += "```";
			return help;
		}
	}
}

exports.DFGame = DFGame;