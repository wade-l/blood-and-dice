"use strict";

const {google} = require('googleapis');
const gconn = require("./googleconnection.js");
const Discord = require('discord.js');
const roller = require("./monsterhearts_roller.js");

const stats = ['hot','cold','dark','volatile'];

function MonsterHeartsKeeper(sheetId, credentials) {
	return {
		'sheetId' : sheetId,
		'credentials': credentials,
		getSheet: async function(id) {
			let offset = (parseInt(id) - 1) * 5;
			let firstcell = String.fromCharCode(65 + offset) + "1";
			let lastcell = String.fromCharCode(65 + offset + 4) + "43";
			console.log(`offset: ${offset}, ${firstcell}:${lastcell}`);
			let characterData = await getSheetData(`${firstcell}:${lastcell}`, 'Characters',sheetId, credentials);
			console.log(characterData);
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
		roll: async function (rollString, characterId) {
			const dividersRegex = /[+\-\#]/;
			let sheet = await this.getSheet(characterId);
			let rollText = "";
			//let roll = roller.rollPool(rollString);

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
				console.log(`Nextindex: ${nextIndex}, NextDivider: ${nextDivider}, LastDivider: ${lastDivider}, RollString: *${rollString}*, term: *${term}*`);
				nextDivider = rollString.charAt(nextIndex);

				rollString = rollString.substring(nextIndex+1, rollString.length);
				nextIndex = rollString.search(dividersRegex);


				let dice = 0;
				if (isNaN(term)) {
					let stat = sheet.getStat(term);
					if (lastDivider != '') rollText += " " + lastDivider + " ";
					rollText += `+${stat.name} (${stat.value})`;
					dice = parseInt(stat.value);
				} else {
					if (lastDivider != '') rollText += " " + lastDivider + " ";
					rollText += `${term}`;
					dice = parseInt(term);
				}
				if (lastDivider == '-') {
					totalBonus -= dice;
				} else {
					totalBonus += dice;
				}

				termCount++;

				lastDivider = nextDivider;
			}

			let roll = roller.pbtaRoll(totalBonus);
			let meaning = "";
			if (roll.total < 7) {
				meaning = " a **miss**! (remember to mark XP)";
			} else if (roll.total < 10) {
				meaning = " a **complicated** success!";
			} else {
				meaning = " a **success**!";
			}
			return `${rollText}, which came up ${roll.dice} for a total of **${roll.total}** - ${meaning}`;
		}
	}	
};

function MonsterHeartsSheet (name) {
	return {
		'characterName' : name,
		getFormattedSheet: function () {
			const embeds = [];			
			let fSheet = "";
			fSheet += `**${this.characterName}** (${this.characterPronouns}) - Played by ${this.playerName}\r`;
			fSheet += `**Hot**: \t\t\t${this.hot}\r`;
			fSheet += `**Cold**: \t\t\t${this.cold}\r`;
			fSheet += `**Volatile**:\t\t${this.volatile}\r`;
			fSheet += `**Dark**:\t\t\t${this.dark}\r`;
			return fSheet;
		},
		getFormattedStatBlock: function () {
				return this.getFormattedSheet();
		},
		getStat: function (stat) {

			let matchedStat = [];

			let matchStats = stats.filter(function (s) {
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

exports.MonsterHeartsKeeper = MonsterHeartsKeeper;
exports.MonsterHeartsSheet = MonsterHeartsSheet;

async function getSheetData(cells, sheetName, sheetId, credentials) {
	let auth = await gconn.getAuth(credentials);
	const sheets = google.sheets({version: 'v4', auth});
  	let characters =[];
  	let res = await sheets.spreadsheets.values.get({
    	spreadsheetId: sheetId,
    	range: `${sheetName}!${cells}`,
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
	let sheet = MonsterHeartsSheet(data[0][0]);
	sheet.characterPronouns = data[1][0];
	sheet.playerName = data[2][0];
	sheet.skin = data[4][0];
	sheet.look = data[5][0];
	sheet.eyes = data[6][0];
	sheet.origin = data[7][0];
	sheet.hot = data[10][2];
	sheet.cold = data[11][2];
	sheet.volatile = data[12][2];
	sheet.dark = data[13][2];

	console.log("parseSheet:");
	console.log(sheet);

	return sheet;
}

function firstCap(s) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}