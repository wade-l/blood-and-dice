"use strict";
const roller = require("./roller.js");

function PbtAGame(gameState) {

	let sheetId = gameState.sheet;

	return {
		"commands": ['roll'],
		"hasCommand": function (command) {
			return this.commands.includes(command);
		},
		"doCommand": async function(command, context) {
			
			let args = context.args;
			let msgDest = context.msgDest;
			let msg = context.msg;

			switch (command) {
				case 'roll': {
					try {
						let rollText = this.roll(args.join(" ").toLowerCase());
						msgDest.send(`${msg.member} rolled ${rollText}`);
					} catch (err) {
						msg.reply(`Sorry, your roll encountered a problem (${err})`);
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
			help += "Unfinished!";
			help += "```";
			return help;
		},
		"roll": function(rollString) {
			const dividersRegex = /[+\-\#]/;
			let rollText = "";

			let nextIndex = rollString.search(dividersRegex);
			let nextDivider = rollString.charAt(nextIndex);
			console.log(`Rollstring is ${rollString}, nextIndex is ${nextIndex}, nextDivider is ${nextDivider}`);
			let lastDivider = '';
			let totalBonus = 0;
			let more = true;
			let termCount = 0;
			while (more) {
				if (nextIndex == -1) {
					more = false;
					nextIndex = rollString.length;
				}

				let term = rollString.substring(0,nextIndex).trim();
				console.log(`Nextindex: ${nextIndex}, NextDivider: ${nextDivider}, LastDivider: ${lastDivider}, RollString: *${rollString}*, term: *${term}*, totalBonus: *${totalBonus}*`);
				nextDivider = rollString.charAt(nextIndex);

				rollString = rollString.substring(nextIndex+1, rollString.length);
				nextIndex = rollString.search(dividersRegex);


				let dice = 0;
				if (isNaN(term)) {
					return "Please use bonuses instead of stat names (like '/roll +2')";
				} else {
					if (lastDivider != '') rollText += " " + lastDivider + " ";
					rollText += `${term}`;
					dice = parseInt(term);
				}

				if (! isNaN(dice)) {
					if (lastDivider == '-') {
						totalBonus -= dice;
					} else {
						totalBonus += dice;
					}
				}

				termCount++;

				lastDivider = nextDivider;
			}

			console.log(totalBonus);
			let roll = roller.pbtaRoll(totalBonus);
			let meaning = "";
			if (roll.total < 7) {
				meaning = " a **miss**! (remember to mark XP)";
			} else if (roll.total < 10) {
				meaning = " a **complicated** success!";
			} else {
				meaning = " a **success**!";
			}
			console.log(roll);
			return `${rollText}, which came up ${roll.dice} for a total of **${roll.total}** - ${meaning}`;
		
		}
	}
}

exports.PbtAGame = PbtAGame;