"use strict";

const {google} = require('googleapis');
const gconn = require("./googleconnection.js");

function VampireKeeper(sheetId, credentials) {
	return {
		'sheetId' : sheetId,
		'credentials': credentials,
		testThis: function () {
			console.log("Test this");
			console.log(sheetId);
			console.log(this.sheetId);
		},
		getSheet: async function(id) {
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
				console.log("Credeintials are:");
				console.log(credentials);
				await setSheetValue(value,cellId,id,sheetId,credentials);
			}
		}
	}	
};

exports.VampireKeeper = VampireKeeper;

async function getSheetData(characterName, sheetId, credentials) {
	console.log("Get Sheet Data:");
	console.log(credentials);
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
	console.log("Set Sheet Value:");
	let auth = await gconn.getAuth(credentials);
	const sheets = google.sheets({version: 'v4', auth});
	let range = `${sheetName}!${cell}:${cell}`;
	console.log(range);
	let body = { values: [
			[ value ]
		]
	};
	console.log(body);
	sheets.spreadsheets.values.update({
		spreadsheetId: sheetId,
		range: range,
		valueInputOption: 'RAW',
		resource: body

	}).then((response) => {
		console.log(response);
		console.log(`${response.data.updatedCells} cells updated.`);
	});
}

function parseSheet(data) {
	let sheet = {};
	sheet.characterName = data[0][1];
	sheet.playerName = data[0][4];
	sheet.vitae = parseInt(data[23][7]);
	sheet.maxVitae = parseInt(data[23][9]);
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
	console.log(sheet.conditions);

	return sheet;

}