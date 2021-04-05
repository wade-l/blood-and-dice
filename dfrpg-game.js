"use strict";
const roller = require("./roller.js");
const dfk = require("./dfrpg-keeper.js");

function DFGame(gameState) {

	let sheetId = gameState.sheet;

	return {
		"keeper": dfk.DFKeeper(sheetId, process.env.BD_GOOGLECREDENTIALS),
		"commands": ['roll','r','fate','f','sheet','help'],
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
			let id = character.source;
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
				case 'f':
				case 'fate': {
					console.log(`Trying to adjust ${command}`);

					let sheet = await keeper.getSheet(id);

					let adjustment = args.join('').toLowerCase().replace(/\s+/g, '');
					if (adjustment.charAt(0) == '+') {
						adjustment = adjustment.slice(1);
						sheet[command] += parseInt(adjustment);
						keeper.setStat(id,command,sheet[command]);
						msg.reply(`you added ${adjustment} to your ${command} (new amount: ${sheet[command]}).\r`);
					} else if (adjustment.charAt(0) == '-') {
						adjustment = adjustment.slice(1);
						sheet[command] -= parseInt(adjustment);
						keeper.setStat(id,command,sheet[command]);
						msg.reply(`you removed ${adjustment} from your ${command} (new amount: ${sheet[command]}).\r`);
					} else if ( Number.isInteger(parseInt(adjustment))) {
						let oldValue = sheet[command];
						sheet[command] = parseInt(adjustment);
						keeper.setStat(id,command,sheet[command]);
						msg.reply(`you set your ${command} to ${adjustment} (it used to be ${oldValue}).\r`);
					} else {
						msg.reply(`You have ${sheet.fate} fate points.`);
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
			help += "/dm sheet\t\t\t DM you a copy of your character sheet\r";
			help += "/f [+/-points]\t\tShow or adjust your fate points\r";
			help += "/fate [+/-points]\t Show or adjust your fate points\r";
			help += "/r [stat name]\t\tRoll Fate dice\r";
			help += "/roll [stat name]\t Roll Fate dice\r";
			help += "/sheet\t\t\t\tDisplay your character sheet in channel\r";
			help += "\r";
			help += "(parts of commands in [square brackets] are optional and not required)\r";
			help += "```";
			return help;
		}
	}
}

exports.DFGame = DFGame;