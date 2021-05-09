"use strict";

const {google} = require('googleapis');
const gconn = require("./googleconnection.js");
const Discord = require('discord.js');
const roller = require("./roller.js");
const wodk = require("./wod-keeper.js")

const attributes = [['intelligence','wits','resolve'],['strength','dexterity','stamina'], ['presence','manipulation','composure']];
const mental_skills = ['academics','computer','crafts','investigation','medicine','occult','politics','science'];
const physical_skills = ['athletics','brawl','drive','firearms','larceny','stealth','survival','weaponry'];
const social_skills = ['animal_ken','empathy','expression','intimidation','persuasion','socialize','streetwise','subterfuge'];
const skills = [ mental_skills, physical_skills, social_skills];


function ChangelingKeeper(sheetId, credentials) {
	let ck = wodk.WoDKeeper(sheetId, credentials);
	ck.setableStats = {'willpower': 'G41', 'glamour': 'D41', 'beats': 'K3', 'experiences': 'K4'}

	ck.parseSheet = function (data) {
		console.log("Doing Changeling parseSheet");
		console.log(data);
		let sheet = ChangelingSheet(data[0][1]);
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
		sheet.kith = data[1][4];
		sheet.seeming = data[1][1];
		sheet.needle = data[2][0];
		sheet.thread = data[2][4];
		sheet.court = data[1][6];
		sheet.willpower = parseInt(data[38][4]) || 0;
		sheet.glamour = parseInt(data[38][1]) || 0;
		sheet.maxGlamour = parseInt(data[38][2]) || 0;
		sheet.maxWillpower = parseInt(data[38][5]) || 0;
		sheet.experiences = parseInt(data[1][8]) || 0;
		sheet.beats = parseInt(data[0][8]) || 0;
		sheet.health = parseInt(data[41][1]) || 0;
		sheet.bashing = parseInt(data[41][2]) || 0;
		sheet.lethal = parseInt(data[41][3]) || 0;
		sheet.aggravated = parseInt(data[41][4]) || 0;
		sheet.woundPenalty = parseInt(data[42][1]) || 0;
		sheet.aspirations = [ data[1][9], data[2][9], data[3][9]];
		sheet.conditions = [];
		sheet.seemingBlessing = data[51][1];
		sheet.seemingCurse = data[52][1];
		sheet.kithBlessing = data[53][1];
		sheet.kithPower = data[54][1];

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

		sheet.disciplines = [];

		let disciplineName = undefined;
		let disciplineRank = undefined;
		let moreDisciplines = true;
		let dIndex = 20;
			while (moreDisciplines) {
			disciplineName = data[dIndex][0];
			if ((typeof disciplineName != "undefined")) {
				disciplineName = disciplineName.toString().toLowerCase();
			}
			disciplineRank = data[dIndex][1];
			if ((typeof disciplineName === "undefined") || disciplineName.length < 1) {
				moreDisciplines = false;
			} else {
				sheet.disciplines.push({
					name: disciplineName,
					value: disciplineRank
				});
			}
			dIndex++;
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

		console.log(sheet);

		return sheet;
	};

	return ck;
};

function ChangelingSheet (name) {
	return {
		'characterName' : name,
		getFormattedSheet: function () {
			const embeds = [];			
			let fSheet = "";
			fSheet += "```fix\r";
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
			fSheet += `Willpower: \t ${this.willpower} / ${this.maxWillpower}\r`;
			fSheet += `Beats: \t\t ${this.beats} \t Experiences: ${this.experiences}\r`;
			fSheet += "```\r";
			return fSheet;
		},
		getFormattedStatBlock: function () {
				let fSheet = "";
				fSheet += "```fix\r";
				fSheet += `Character: \t ${this.characterName}\tPlayer: \t${this.playerName}\r`;
				fSheet += `Glamour: \t ${this.glamour} / ${this.maxGlamour}\r`;
				fSheet += `Willpower: \t ${this.willpower} / ${this.maxWillpower}\r`;
				fSheet += `Beats: \t\t ${this.beats} \t Experiences: ${this.experiences}\r`;
				let healthString = "Health: \t\t";
				healthString += "B".repeat(this.bashing);
				healthString += "L".repeat(this.lethal);
				healthString += "A".repeat(this.aggravated);
				let healthLeft = this.health - (this.bashing + this.lethal + this.aggravated);
				if (healthLeft > 0) healthString += "O".repeat(healthLeft);
				healthString += `  (Wound Penalty: ${this.woundPenalty})\r`;
				fSheet += healthString;
				fSheet += "```\r";
				return fSheet;
		},
		getFormattedBlessings: function () {
			let fBlessings = "";
			fBlessings += "```fix\r";
			fBlessings += `Character: \t ${this.characterName}\tPlayer: \t${this.playerName}\r`;
			fBlessings += `\rSeeming: ${this.seeming}\r`;
			fBlessings += `Blessing: ${this.seemingBlessing}\r`;
			fBlessings += `Curse: ${this.seemingCurse}\r`;
			fBlessings += `\rKith: ${this.kith}\r`;
			fBlessings += `Blessing: ${this.kithBlessing}\r`;
			fBlessings += `Power: ${this.kithPower}\r`;

			fBlessings += "```\r";
			return fBlessings;
		},
		getStat: function (stat) {
			let matchedStat = [];
			let allStats = attributes.flat(2).concat(skills.flat(2));

			// A hack specifically for animal ken
			if (stat == "ken") {
				stat = "animal_ken";
			}

			if (stat == "WoundPenalty") {
				return {name: "Wound Penalty",
						value: this.woundPenalty
					};
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

		}
	};
}

exports.ChangelingKeeper = ChangelingKeeper;
exports.ChangelingSheet = ChangelingSheet;

function firstCap (s) {
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