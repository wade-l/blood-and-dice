"use strict";
const roller = require("./roller.js");
const vk = require("./vampire-keeper.js");

function VampireGame() {

	return {
		"keeper": vk.VampireKeeper('1OeSRHL38EheCYsdHpxX04cI5ghHqYeIf2u43hERyYI8', process.env.BD_GOOGLECREDENTIALS),
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
			let id = character.source;
			let args = context.args;
			let msgDest = context.msgDest;
			let msg = context.msg;
			let keeper = this.keeper;
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
				case 'r8':
				case 'roll8': {
					try {
						let rollText = await keeper.roll(args.join(" ").toLowerCase(),id, 8);
						msgDest.send(`${msg.member} rolled (with 8-again) ${rollText}`);
					} catch (err) {
						msg.reply(`Sorry, your roll encountered a problem (${err})`);
					}
					break;
				}
				case 'r9':
				case 'roll9': {
					try {
						let rollText = await keeper.roll(args.join(" ").toLowerCase(),id, 9);
						msgDest.send(`${msg.member} rolled (with 9-again) ${rollText}`);
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
				}
				case 'vitae':
				case 'health':
				case 'willpower':
				case 'beats':
				case 'experiences': {
					console.log(`Trying to adjust ${command}`);

					let sheet = await keeper.getSheet(id);

					let adjustment = args.join('').toLowerCase().replace(/\s+/g, '');
					if (adjustment.charAt(0) == '+') {
						adjustment = adjustment.slice(1);
						sheet[command] += parseInt(adjustment);

						if ((command == 'beats') && (sheet[command] >= 5)) {
							let beats = sheet['beats'] - 5;
							let experiences = sheet['experiences'] + 1;
							keeper.setStat(id,'beats',beats);
							keeper.setStat(id,'experiences',experiences);
							msg.reply(`you added ${adjustment} to your beats, and gained experience (new beats: ${beats}, experiences: ${experiences}).\r`);

						} else {
							keeper.setStat(id,command,sheet[command]);
							msg.reply(`you added ${adjustment} to your ${command} (new amount: ${sheet[command]}).\r`);
						}
					} else if (adjustment.charAt(0) == '-') {
						adjustment = adjustment.slice(1);
						sheet[command] -= parseInt(adjustment);
						keeper.setStat(id,command,sheet[command]);
						msg.reply(`you removed ${adjustment} from your ${command} (new amount: ${sheet[command]}).\r`);
					} else if ( Number.isInteger(parseInt(adjustment))) {
						sheet[command] = parseInt(adjustment);
						keeper.setStat(id,command,sheet[command]);
						msg.reply(`you set your ${command} to ${adjustment}.\r`);
					} else {
						msg.reply("I don't know what you were trying to do.");
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
			help += "/aspirations\t\tSee your aspirations\r";
			help += "/asp\t\tSee your aspirations\r";
			help += "/conditions\t\tSee your conditions\r";
			help += "/conditions\t\tSee your conditions\r";
			help += "/dm <aspirations/conditions/sheet>\tSend you the information via DM\r";
			help += "/roll <X> \t\t Roll <X> dice\r";
			help += "/roll8 <X> \t\t Roll <X> dice with the 8-again quality\r";
			help += "/roll9 <X> \t\t Roll <X> dice with the 9-again quality\r";
			help += "/r | /r8 | /r9 \t\t Same as /roll, /roll8, /roll9 but shorter\r"
			help += "/sheet\t\tSee your character sheet\r";
			help += "/stats\t\tSee brief character stats\r";
			help += "/vitae/willpower/experiences/beats <X>\t\t Sets that stat to <X>\r";
			help += "/vitae/willpower/experiences/beats +<X>\t\t Adds <X> to the stat.\r";
			help += "/vitae/willpower/experiences/beats -<X>\t\t Subtracts <X> from the stat.\r";
			help += "```";
			return help;
		}
	}
}

exports.VampireGame = VampireGame;



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