"use strict";

const {google} = require('googleapis');
const gconn = require("./googleconnection.js");
const Discord = require('discord.js');
const roller = require("./dungeonworld-roller.js");

const stats = ['str','dex','con','wis','int','cha'];

function DungeonWorldKeeper(sheetId, credentials) {
	return {
		'sheetId' : sheetId,
		'credentials': credentials,
		getSheet: async function(id) {
			let offset = (parseInt(id) - 1) * 5;
			let firstcell = String.fromCharCode(65 + offset) + "1";
			let lastcell = String.fromCharCode(65 + offset + 4) + "43";
			console.log(`offset: ${offset}, ${firstcell}:${lastcell}`);
			console.log("Getting character data:");
			let characterData = await getSheetData(`${firstcell}:${lastcell}`, 'Party',sheetId, credentials);
			console.log(characterData);
			return parseSheet(characterData);
		},
		setStat: async function(id, stat, value) {
		},
		roll: async function (rollString, characterId) {
			const dividersRegex = /[+\-\#]/;
			let sheet = await this.getSheet(characterId);
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

function DungeonWorldSheet (name) {
	return {
		'characterName' : name,
		getFormattedSheet: function () {
			const embeds = [];			
			let fSheet = "";
			fSheet += `**${this.characterName}**- Played by ${this.playerName}\r`;
			fSheet += `**Str**: \t\t\t${this.str}\r`;
			fSheet += `**Dex**: \t\t\t${this.dex}\r`;
			fSheet += `**Con**:\t\t${this.con}\r`;
			fSheet += `**Int**:\t\t\t${this.int}\r`;
			fSheet += `**Wis**:\t\t\t${this.wis}\r`;
			fSheet += `**Cha**:\t\t\t${this.cha}\r`;
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

exports.DungeonWorldKeeper = DungeonWorldKeeper;
exports.DungeonWorldSheet = DungeonWorldSheet;

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
	let sheet = DungeonWorldSheet(data[1][1]);
	sheet.playerName = data[0][1];
	sheet.str = data[8][3];
	sheet.dex = data[9][3];
	sheet.con = data[10][3];
	sheet.int = data[11][3];
	sheet.wis = data[12][3];
	sheet.cha = data[13][3];

	console.log("parseSheet:");
	console.log(sheet);

	return sheet;
}

function firstCap(s) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}