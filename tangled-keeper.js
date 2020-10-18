"use strict";

const {google} = require('googleapis');
const gconn = require("./googleconnection.js");
const Discord = require('discord.js');
const roller = require("./roller.js");

const skills = ['athletics','craftsmanship','coercion','discipline','endurance','hand-to-hand','larceny','medicine','perception','presence','research','shooting','stealth','survival'];

function TangledThreadsKeeper(sheetId, credentials) {
	return {
		'sheetId' : sheetId,
		'credentials': credentials,
		getSheet: async function(id) {
			console.log("Getting sheet for " + id);
			let characterData = await getSheetData(id, sheetId, credentials);
			return parseSheet(characterData);
		},
		setStat: async function(id, stat, value) {
			let cellId;
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
			if (typeof cellId != "undefined") {
				await setSheetValue(value,cellId,id,sheetId,credentials);
			}
		},
		roll: async function (rollString, characterId, bolstered = false, hindered = false) {
			const dividersRegex = /[+\-\#]/;
			let sheet = null;
			try {
				sheet = await this.getSheet(characterId);
			} catch (e) {
				console.log("No sheet, but that's okay");
			}
			let rollText = "";

			let nextIndex = rollString.search(dividersRegex);
			let nextDivider = rollString.charAt(nextIndex);
			let lastDivider = '';
			let totalDice = 0;
			let more = true;
			let termCount = 0;
			while (more) {
				if (nextIndex == -1) {
					more = false;
					nextIndex = rollString.length;
				}

				let term = rollString.substring(0,nextIndex).trim();
				nextDivider = rollString.charAt(nextIndex);

				rollString = rollString.substring(nextIndex+1, rollString.length);
				nextIndex = rollString.search(dividersRegex);


				let dice = 0;
				if (isNaN(term)) {
					if (sheet == null) {
						return "an error! You can't use stat names until you've had a character sheet assigned to you.";
					}
					let stat = sheet.getStat(term);
					if (lastDivider != '') rollText += " " + lastDivider + " ";
					rollText += `${stat.name} (${stat.value})`;
					dice = parseInt(stat.value);
				} else {
					if (lastDivider != '') rollText += " " + lastDivider + " ";
					rollText += `${term}`;
					dice = parseInt(term);
				}
				if (lastDivider == '-') {
					totalDice -= dice;
				} else {
					totalDice += dice;
				}

				termCount++;

				lastDivider = nextDivider;
			}


			if (termCount > 1) {
				rollText+= ` (${totalDice} cards total)`;
			}

			if (bolstered && hindered) {
				rollText += " bolstered **and** hindered ";
			} else if (bolstered) {
				rollText +=  "bolstered ";
			} else if (hindered) {
				rollText += " hindered ";
			}

			rollText += " cards ";

			if (totalDice < 1) {
				rollText += ", but since they don't have any cards they fail in the worst way possible.";
				return rollText;
			}

			console.log("About to draw");
			let roll = roller.drawTangled(totalDice, bolstered, hindered);
			rollText += `: ${roll.text} `;

			if (roll.successes >= 1) {
				if (roll.savage == 1) {
					rollText += `- **${roll.successes}** successes (${roll.savage} savage card).`;
				} else if (roll.savage >1 ) {
					rollText += `- **${roll.successes}** successes (${roll.savage} savage cards).`;
				}
				else {
					rollText += `- **${roll.successes}** successes.`;
				}
			} else {
				rollText += `- **Failure**.`;
			}
			return rollText;
		}	
	}	
};

function TangledThreadsSheet (name) {
	return {
		'characterName' : name,
		getFormattedSheet: function () {
			const embeds = [];			
			let fSheet = "";
			fSheet += "```fix\r";
			fSheet += `Character: \t ${this.characterName}\tPlayer: \t${this.playerName}\r`;
			fSheet += `Concept: \t ${this.concept}\r\r`;

			let rightcolumn = [
				"\t\tQualities",
				formatStat("Luck",this.luck) + "\t" + formatStat("Luck Points", this.luckpoints),
				formatStat("Potential", this.potential),
				formatStat("Power", this.power),
				formatStat("Skill",this.skill)
			];
			let leftcolumn = ["Threads".padEnd(35),
				`${formatThread("Target","Role","Twisted")}`
			];

			let threads = 0;
			while (threads < this.threads.length) {
				leftcolumn.push(`${formatThread(this.threads[threads].target,this.threads[threads].role,this.threads[threads].twisted)}`);
				threads++;
			}

			let rows = 0;
			while (rows < Math.max(rightcolumn.length,leftcolumn.length)) {
				if (rows < leftcolumn.length) {
					fSheet += leftcolumn[rows].padEnd(35);
				} else {
					fSheet += "".padEnd(35);
				}

				if (rows < rightcolumn.length) {
					fSheet += rightcolumn[rows];
				
				}
				fSheet += "\r";
				rows++;
			}

			fSheet += "\rSkills\r";

			let i = 0;
			while (i < Math.floor(skills.length / 2)) {
				let firstSkill = skills[i];
				let firstSkillValue = this[firstSkill];
				let secondSkill = skills[i+7];
				let secondSkillValue = this[secondSkill];

				fSheet += formatStat(firstSkill,firstSkillValue);
				fSheet += formatStat(secondSkill, secondSkillValue);
				fSheet += "\r";

				i++;
			}

			fSheet += "\rTraits\r";
			let traits = 0;
			while (traits < this.traits.length) {
				fSheet += formatStat(this.traits[traits].name,this.traits[traits].value);
				fSheet += "\r";

				traits++;
			}

			fSheet += "\rWounds\r";
			fSheet += `${this.surface.suffered} surface wounds (${this.surface.capacity} max)\r`;
			fSheet += `${this.severe.suffered} severe wounds (${this.severe.capacity} max)\r`;
			fSheet += `${this.crippled.suffered} crippled wounds (${this.crippled.capacity} max)\r`;

			fSheet += "\r\r";
			fSheet += `Character Points: ${this.characterpoints}\r`;

			fSheet += "```\r";
			return fSheet;
		},
		getStat: function (stat) {
			let matchedStat = [];

			let matchStats = skills.filter(function (s) {
				return (s.substring(0,stat.length).localeCompare(stat) == 0);
			})
			for (let i = 0; i < matchStats.length; i++) {
				matchedStat.push({
					name: firstCap(matchStats[i]),
					value: this[matchStats[i]]
				});
			}
			
			if (matchedStat.length == 1) {
				return matchedStat[0];
			} else {
				throw new Error(`getStat: couldn't unambigiously determine stat (${stat}).`);
			}

		}
	};
}

exports.TangledThreadsKeeper = TangledThreadsKeeper;
exports.TangledThreadsSheet = TangledThreadsSheet;

async function getSheetData(characterName, sheetId, credentials) {
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

async function setSheetValue(value,cell,sheetName,sheetId,credentials) {
	let auth = await gconn.getAuth(credentials);
	const sheets = google.sheets({version: 'v4', auth});
	let range = `${sheetName}!${cell}:${cell}`;
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
	let sheet = TangledThreadsSheet(data[0][1]);
	sheet.playerName = data[0][3];
	sheet.concept = data[1][1];

	sheet.luck = data[5][5];
	sheet.luckpoints = data[5][7];
	sheet.potential = data[6][5];
	sheet.power = data[7][5];
	sheet.skill = data[8][5];
	sheet.characterpoints = data[9][5];

	let i = 0;
	while (i < skills.length) {
		sheet[skills[i]] = data[13 + (i % 7)][1 + (Math.floor(i / 7)*2)];
		i++;
	}

	sheet.threads = [];

	i = 0;
	while (i < 5) {
		let target = data[5+i][0];
		if (typeof target !== "undefined" && target.length > 0) {
			let role = data[5+i][1];
			let twisted = data[5+1][2];
			if (typeof twisted === "undefined" || twisted.length < 1) twisted = "No";

			sheet.threads.push({
				target: target,
				role: role,
				twisted: twisted
			});
		}
		i++;
	}

	sheet.traits = [];
	let traitName = undefined;
	let traitRank = undefined;
	let moreTraits = true;
	let tIndex = 22;
	while (moreTraits) {
		if (typeof data[tIndex] === "undefined") {
			moreTraits = false;
		} else {
			traitName = data[tIndex][0];

			if ((typeof traitName === "undefined") || traitName.length < 1) {
				moreTraits = false;
			} else {
				traitName = traitName.toString().toLowerCase();
				traitRank = data[tIndex][1];
				sheet.traits.push({
					name: traitName,
					value: traitRank
				});
			}
			tIndex++;
		}
	}

	sheet.surface = {
		capacity : data[22][3],
		suffered : data[22][4]};
	sheet.severe = {
		capacity : data[23][3],
		suffered : data[23][4]};
	sheet.crippled = {
		capacity : data[24][3],
		suffered : data[24][4]};

	return sheet;
}

function firstCap(s) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatStat(stat, value) {
	let formattedString = firstCap(stat).substring(0,20);
	formattedString = formattedString.padEnd(20);
	formattedString += "\t";
	if (typeof value === "undefined") value = 0;
	formattedString += value.toString().padEnd(2);
	formattedString += "\t";
	return formattedString;
}

function formatThread(target, role, twisted) {
	let formattedString = firstCap(target).substring(0,15);
	formattedString = formattedString.padEnd(15);
	formattedString += "\t";
	formattedString += role.toString().padEnd(10);
	formattedString += "\t";
	formattedString += twisted.toString().padEnd(10);
	return formattedString;
}	