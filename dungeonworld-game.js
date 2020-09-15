"use strict";
const roller = require("./dungeonworld-roller.js");
const dwk = require("./dungeonworld-keeper.js");

function DungeonWorldGame() {

	return {
		"keeper": dwk.DungeonWorldKeeper('1VOvdNMqAy9RSvLCZ5DazXep9zcy1h0zM8WeBD5wihFY', process.env.BD_GOOGLECREDENTIALS),
		"commands": ['roll','sheet','stats','stat'],
		"hasCommand": function (command) {
			return this.commands.includes(command);
		},
		"doCommand": async function(command, context) {
			
			let character = context.character;
			let args = context.args;
			let msgDest = context.msgDest;
			let msg = context.msg;
			let keeper = this.keeper;

			if (context.character === undefined) {
				msg.reply("sorry, you don't appear to have a character assigned to you.");
				return;
			}

			switch (command) {
				case 'roll': {
					if (args.length == 0) {
						let roll1 = roller.rollDie(6);
						let roll2 = roller.rollDie(6);
						let total = roll1 + roll2;
						msg.channel.send(`${msg.member} rolled ${dice.d6ToEmoji(roll1)} ${dice.d6ToEmoji(roll2)} : **${total}**`);	
					} else {
						let rollString = args.join(" ").toLowerCase();
						let sides = parseInt(rollString);
						if (! isNaN(sides)) {
							console.log(typeof sides);
							let roll = roller.rollDie(sides);
							msg.reply(`rolled ${roll} on a ${sides}-sided die.`);
						} else {
							console.log(`Trying to roll '${sides}'`);
							let rollText = await keeper.roll(rollString,character.characterName);
							msg.channel.send(`${msg.member} rolled ${rollText}`);
						}
					}
					break;
				}
				case 'map':
					msg.reply("You can see the map at https://drive.google.com/file/d/1M2rSyayJ73XL-HRHMF71lIu-xKbjbc6b/view?usp=sharing");
					break;
				case 'sheet':
					msg.reply("Sorry, character sheet functionality not yet working. Go to https://docs.google.com/spreadsheets/d/1VOvdNMqAy9RSvLCZ5DazXep9zcy1h0zM8WeBD5wihFY/edit?usp=sharing instead.");
					break;
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
				default:
					break;
				
			}
		},
		"getHelp": function() {
			let help = "```fix\r";
			help += "Commands:\r";
			help += "/map                                   See the campaign map\r";
			help += "/roll                                  Roll 2d6\r";
			help += "/roll <X>                              Roll an <X>-sided die\r";
			help += "/roll [str|dex|con|int|wis|cha]        Roll 2d6 + stat\r";
			help += "/sheet                                 See your character sheet\r";
			help += "/?                                     See this help\r";
			help += "```";
			return help;
		}
	}
}

exports.DungeonWorldGame = DungeonWorldGame;