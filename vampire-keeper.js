"use strict";

const {google} = require('googleapis');
const gconn = require("./googleconnection.js");
const Discord = require('discord.js');

const attributes = [['intelligence','wits','resolve'],['strength','dexterity','stamina'], ['presence','manipulation','composure']]
const skills = [
		['academics','computer','crafts','investigation','medicine','occult','politics','science'],
		['athletics','brawl','drive','firearms','larceny','stealth','survival','weaponry'],
		['animal_ken','empathy','expression','intimidation','persuasion','socialize','streetwise','subterfuge']];

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
				await setSheetValue(value,cellId,id,sheetId,credentials);
			}
		}
	}	
};

function VampireSheet (name) {
	return {
		'characterName' : name,
		getFormattedSheet: function () {
			const embeds = [];
			let attributeEmbed = new Discord.MessageEmbed()
				.setColor('#cf2923')
				.setTitle("Attributes");
			for (let row = 0; row < 3; row++) {
				for (let column = 0; column < 3; column ++) {
					let attribute = attributes[column][row];
					let field = { name: firstCap(attribute), value: this[attribute], inline: true };
					attributeEmbed.fields.push(field);
				}
			}
			embeds.push(attributeEmbed);


			let skillsEmbed = new Discord.MessageEmbed()
				.setColor('#cf2923')
				.setTitle("Skills");
			for (let row = 0; row < 8; row++) {
				for (let column = 0; column < 3; column ++) {					
					let skill = skills[column][row];
					let field = { name: firstCap(skill), value: this[skill], inline: true };
					skillsEmbed.fields.push(field);
				}
			}
			embeds.push(skillsEmbed);
			//console.log(sheetEmbed);

			//return embeds;
			let fSheet = "";
			fSheet += "```\r";
			fSheet += `Character: \t ${this.characterName}\tPlayer: \t${this.playerName}\r`;
			for (let row = 0; row < 3; row++) {
				for (let column = 0; column < 3; column ++) {
					let attribute = attributes[column][row];
					fSheet += formatStat(attribute, this[attribute]);
				}
				fSheet += "\r";
			}
			fSheet += `Vitae: \t\t ${this.vitae} / ${this.maxVitae}\r`;
			fSheet += `Willpower: \t ${this.willpower} / ${this.maxWillpower}\r`;
			fSheet += `Beats: \t\t ${this.beats} \t Experiences: ${this.experiences}\r`;
			fSheet += "```\r";
			return fSheet;
		},
		getFormattedStatBlock: function () {
				let fSheet = "";
				fSheet += "fix\r";
				fSheet += `Character: \t ${this.characterName}\tPlayer: \t${this.playerName}\r`;
				fSheet += `Vitae: \t\t ${this.vitae} / ${this.maxVitae}\r`;
				fSheet += `Willpower: \t ${this.willpower} / ${this.maxWillpower}\r`;
				fSheet += `Beats: \t\t ${this.beats} \t Experiences: ${this.experiences}\r`;
				fSheet += "```\r";
				return fSheet;
		}
	};
}

exports.VampireKeeper = VampireKeeper;
exports.VampireSheet = VampireSheet;

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
	let sheet = VampireSheet(data[0][1]);
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
			console.log(`Skillname: ${skillname}, skilldata: ${skilldata}, skillvalue: ${skillvalue}`);
			sheet[skillname] = skillvalue;
			let speciality = data[row+10][(column*3)+2];
			if (speciality) {
				sheet.specialities[skillname] = speciality;
			}
		}
	}
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