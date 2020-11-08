"use strict";

const {google} = require('googleapis');
const gconn = require("./googleconnection.js");
const Discord = require('discord.js');
const roller = require("./roller.js");

const attributes = [['intelligence','wits','resolve'],['strength','dexterity','stamina'], ['presence','manipulation','composure']];
const mental_skills = ['academics','computer','crafts','investigation','medicine','occult','politics','science'];
const physical_skills = ['athletics','brawl','drive','firearms','larceny','stealth','survival','weaponry'];
const social_skills = ['animal_ken','empathy','expression','intimidation','persuasion','socialize','streetwise','subterfuge'];
const skills = [ mental_skills, physical_skills, social_skills];

function WoDKeeper(sheetId, credentials) {
	return {
		'sheetId' : sheetId,
		'credentials': credentials,
		'setableStats': {'willpower': 'H22', 'beats': 'H31', 'experiences': 'H30'},
		getSheet: async function(id) {
			console.log("Getting sheet for " + id);
			let characterData = await getSheetData(id, sheetId, credentials);
			return this.parseSheet(characterData);
		},
		setStat: async function(id, stat, value) {
			let cellId = this.setableStats[stat];
			console.log(`CellId: ${cellId}`);
			if (typeof cellId != "undefined") {
				await setSheetValue(value,cellId,id,sheetId,credentials);
			}
		},
		roll: async function (rollString, characterId, again = 10) {
			const dividersRegex = /[+\-\#]/;
			let sheet = await this.getSheet(characterId);
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
					let stat = sheet.getStat(term);
					if (lastDivider != '') rollText += " " + lastDivider + " ";
					if (stat.value > 0 ) {
						rollText += `${stat.name} (${stat.value})`;
						dice = parseInt(stat.value);
					} else {
						let unskilledPenalty = getUnskilledPenalty(stat.name);
						rollText += `${stat.name} (Unskilled ${unskilledPenalty})`;
						dice = unskilledPenalty;
					}
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
				rollText+= ` (${totalDice} dice total)`;
			}


			let roll = roller.rollPool(totalDice, again);
			rollText += `: ${roll.text} `;
			if (roll.successes >= 5) {
				rollText += `- **${roll.successes}** successes - **Exceptional Success**.`;
			} else if (roll.successes >= 1) {
				rollText += `- **${roll.successes}** successes.`;
			} else if (roll.successes == 0) {
				rollText += `- **Failure**.`;
			} else {
				rollText += ` - **Dramatic Failure**.`;
			}
			return rollText;
		},
		parseSheet: function (data) {
			console.log("Doing WoD parseSheet");
			let sheet = WoDSheet(data[0][1]);
			sheet.playerName = data[0][4];
			for (let row = 0; row < 3; row++) {
				for (let column = 0; column < 3; column ++) {
					sheet[attributes[column][row]] = parseInt(data[row+5][(column*3)+1]);
				}
			}
			sheet.specialities = {};

			for (let row = 0; row < 8; row++) {
				for (let column = 0; column < 3; column ++) {
					let skillname = skills[column][row];
					let skilldata = data[row+10][(column*3)+1];
					let skillvalue = parseInt(skilldata);
					if (! (skillvalue > 0) ) skillvalue = 0;	
					sheet[skillname] = skillvalue;
					let speciality = data[row+10][(column*3)+2];
					if (speciality) {
						sheet.specialities[skillname] = speciality;
					}
				}
			}
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

			sheet.merits = [];
			let meritName = undefined;
			let meritRank = undefined;
			let moreMerits = true;
			let mIndex = 20;
			while (moreMerits) {
				meritName = data[mIndex][3];
				meritRank = data[mIndex][4];
				if ((typeof meritName === "undefined") || meritName.length < 1) {
					moreMerits = false;
				} else {
					meritName = meritName.toString().toLowerCase();
					sheet.merits.push({
						name: meritName,
						value: meritRank
					});
				}
				mIndex++;
			}

			return sheet;
		}	
	}	
};

function WoDSheet (name) {
	return {
		'characterName' : name,
		getFormattedSheet: function () {
			const embeds = [];			
			let fSheet = getBasicSheetHeader();
			

			let maxRows = Math.max(4,this.disciplines.length, this.merits.length);
			for (let i = 0; i < maxRows; i++) {
				if (typeof this.disciplines[i] != 'undefined') {
					fSheet += formatStat(this.disciplines[i].name, this.disciplines[i].value);
				} else {
					fSheet += formatStat("","");
				}
				if (typeof this.merits[i] != 'undefined') {
					fSheet += formatStat(this.merits[i].name, this.merits[i].value);
				} else {
					fSheet += formatStat("","");
				}
				fSheet += "\r";
			}
			fSheet += `Vitae: \t\t ${this.vitae} / ${this.maxVitae}\r`;

			return fSheet;
		},
		getBasicSheetHeader: function () {
			let fSheet = "```fix\r";
			fSheet += `Character: \t ${this.characterName}\tPlayer: \t${this.playerName}\r`;
			fSheet += "\rAttributes\r";

			for (let row = 0; row < 3; row++) {
				for (let column = 0; column < 3; column ++) {
					let attribute = attributes[column][row];
					fSheet += formatStat(attribute, this[attribute]);
				}
				fSheet += "\r";
			}
			fSheet += "\rSkills\r";

			for (let row = 0; row < 8; row++) {
				for (let column = 0; column < 3; column ++) {					
					let skill = skills[column][row];
					let skillvalue = this[skill];
					if (typeof this.specialities[skill] != 'undefined') {
						skill += "(" + this.specialities[skill] + ")";
					}
					fSheet += formatStat(skill, skillvalue);
				}
				fSheet += "\r"
			}
			
			fSheet += "\r";

			return fSheet;
		},
		getBasicSheetFooter: function () {
			let fSheet = `Willpower: \t ${this.willpower} / ${this.maxWillpower}\r`;
			fSheet += `Beats: \t\t ${this.beats} \t Experiences: ${this.experiences}\r`;
			fSheet += "```\r";

			return fSheet;
		},
		getFormattedStatBlock: function () {
				let fSheet = "";
				fSheet += "```fix\r";
				fSheet += `Character: \t ${this.characterName}\tPlayer: \t${this.playerName}\r`;
				fSheet += `Vitae: \t\t ${this.vitae} / ${this.maxVitae}\r`;
				fSheet += `Willpower: \t ${this.willpower} / ${this.maxWillpower}\r`;
				fSheet += `Beats: \t\t ${this.beats} \t Experiences: ${this.experiences}\r`;
				fSheet += "```\r";
				return fSheet;
		},
		getStat: function (stat) {
			let matchedStat = [];
			let allStats = attributes.flat(2).concat(skills.flat(2));

			// A hack specifically for animal ken
			if (stat == "ken") {
				stat = "animal_ken";
			}

			let matchStats = allStats.filter(function (s) {
				return (s.substring(0,stat.length).localeCompare(stat) == 0);
			})
			for (let i = 0; i < matchStats.length; i++) {
				matchedStat.push({
					name: firstCap(matchStats[i]),
					value: this[matchStats[i]]
				});
			}
			
			let matchDisciplines = this.disciplines.filter(function (d) {
				return (d.name.substring(0,stat.length).localeCompare(stat) == 0);
			});
			for (let i = 0; i < matchDisciplines.length; i++) {
				matchedStat.push({
					name: firstCap(matchDisciplines[i].name),
					value: matchDisciplines[i].value
				});
			}

			let matchMerits = this.merits.filter(function (m) {
				return (m.name.substring(0,stat.length).localeCompare(stat) == 0);
			});
			for (let i = 0; i < matchMerits.length; i++) {
				matchedStat.push({
					name: firstCap(matchMerits[i].name),
					value: matchMerits[i].value
				});
			}

			if (matchedStat.length == 1) {
				return matchedStat[0];
			} else {
				throw new Error(`getStat: couldn't unambigiously determine stat (${stat}).`);
			}

		},
		firstCap: function (s) {
			return s.charAt(0).toUpperCase() + s.slice(1);
		},

		formatStat: function(stat, value) {
			let formattedString = firstCap(stat).substring(0,20);
			formattedString = formattedString.padEnd(20);
			formattedString += "\t";
			formattedString += value.toString().padEnd(2);
			formattedString += "\t";
			return formattedString;
		}
	};
}

exports.WoDKeeper = WoDKeeper;
exports.WoDSheet = WoDSheet;

async function getSheetData(characterName, sheetId, credentials) {
	let auth = await gconn.getAuth(credentials);
	const sheets = google.sheets({version: 'v4', auth});
  	let characters =[];
  	let res = await sheets.spreadsheets.values.get({
    	spreadsheetId: sheetId,
    	range: `${characterName}!C3:K53`,
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
		console.log(response.data);
		console.log(`${response.data.updatedCells} cells updated.`);
	});
}

function getUnskilledPenalty(skill) {
	skill = skill.toLowerCase();
	if (mental_skills.includes(skill)) return -3;
	if (physical_skills.includes(skill)) return -1;
	if (social_skills.includes(skill)) return -1;
	return 0;
}	