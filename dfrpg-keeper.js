"use strict";

const {google} = require('googleapis');
const gconn = require("./googleconnection.js");
const Discord = require('discord.js');
const roller = require("./roller.js");

const ladder = ['Terrible','Poor','Mediocre','Average','Fair','Good','Great','Superb','Fantastic','Epic','Legendary'];
const skills = ['alertness','athletics','burglary','contacts','conviction','craftsmanship','deceit','discipline','driving','empathy','endurance','fists','guns','intimidation','investigation','lore','might','performance','presence','rapport','resources','scholarship','stealth','survival','weapons'];

function DFKeeper(sheetId, credentials) {
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
				case 'fate':
					cellId = 'K5';
					break;
			}
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
					rollText += `${getDescriptor(stat.value)} ${stat.name}`;
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

			let roll = roller.fateRoll(totalDice);
			rollText += `: ${roll.dice} = ** ${getDescriptor(roll.total)} (${roll.total}) **`;
			return rollText;
		}	
	}	
};

function DFSheet (name) {
	return {
		'characterName' : name,
		getFormattedSheet: function () {
			const embeds = [];			
			let fSheet = "";
			fSheet += "```fix\r";
			fSheet += `Character: \t ${this.characterName}\tPlayer: \t${this.playerName}\r`;
			fSheet += "\rSkills\r";

			for (let rank = 7; rank > 0; rank--) {
				let skillList = "";
				for (let i = 0; i < skills.length; i++) {
					if (this[skills[i]] == rank) {
						if (skillList != "") {
							skillList = skillList + ", ";
						}
						skillList = skillList + firstCap(skills[i]);
					}
				}
				if (skillList != "" ) {
					let descriptor = getDescriptor(rank) + ":";
					fSheet += "" + descriptor.padEnd(10)  + "\t ";					
					fSheet += skillList;
					fSheet += "\r";
				}
			}
			fSheet += `\rFate Points: \t ${this.fate}\r`;
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
			let allStats = skills;

			let matchStats = allStats.filter(function (s) {
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

exports.DFKeeper = DFKeeper;
exports.DFSheet = DFSheet;

async function getSheetData(characterName, sheetId, credentials) {
	let auth = await gconn.getAuth(credentials);
	const sheets = google.sheets({version: 'v4', auth});
  	let characters =[];
  	let res = await sheets.spreadsheets.values.get({
    	spreadsheetId: sheetId,
    	range: `${characterName}!A1:Z50`,
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
	let sheet = DFSheet(data[3][2]);
	sheet.playerName = data[3][6];
	sheet.characterName = data[3][2];
	for (let row = 0; row < 25; row++) {
		let skillName = skills[row];
		let skillData = data[6+row][7]
		let skillValue = parseInt(skillData);
		if (! (skillValue > 0) ) skillValue = 0;
		sheet[skillName] = skillValue;
	}

	sheet.fate = parseInt(data[4][10]);

	console.log(sheet);
	return sheet;
}

function firstCap(s) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatStat(stat, value) {
	let formattedString = firstCap(stat).substring(0,20);
	formattedString = formattedString.padEnd(20);
	formattedString += "\t";
	formattedString += value.toString().padEnd(2);
	formattedString += "\t";
	return formattedString;
}

function getDescriptor(value) {

	let statIndex = value + 2;
	if (statIndex < 0) {
		return "Terrible " + statIndex;
	} else if (statIndex > 10) {
		return "Legendary +" + (statIndex - 10);
	} else {
		return ladder[statIndex];
	}
}