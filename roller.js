"use strict";

function rollPool(pool, again = 10)
{
	console.log(`Asked to roll *${pool}*`);
	pool = parseInt(pool);
	if (! Number.isInteger(pool) ) return false;
	if (pool > 50 ) return false;
	var roll = {
		successes : 0,
		text : "",
		dice: pool
	};

	if (pool < 1) {
		let currentRoll = rollSTDie(10, again);
		roll.successes = currentRoll.successes;
		roll.text = currentRoll.text;
		if (currentRoll.firstDie == 1) roll.successes = -1;
		return roll;
	}

	for (let i = 0; i < pool; i++) {
		let currentRoll = rollSTDie(8, again);
		roll.successes += currentRoll.successes;
		roll.text += currentRoll.text;
	}

	return roll;

}

function drawTangled(pool, bolstered = false, hindered = false) {
	console.log(`Asked to draw *${pool} cards`);
	pool = parseInt(pool);
	if (! Number.isInteger(pool) ) return false;
	if (pool > 50 || pool < 1 ) return false;
	var roll = {
		successes : 0,
		savage: 0,
		text : "",
		dice: pool
	};

	for (let i = 0; i < pool; i++) {
		let currentRoll = drawTangledCard(bolstered, hindered);
		roll.successes += currentRoll.successes;
		roll.savage += currentRoll.savage;
		roll.text += currentRoll.text;
	}

	return roll;
}

function pbtaRoll(bonus) {
	console.log(`Asked to roll PBTA-style with ${bonus}`);
	let roll1 = rollDie(6);
	let roll2 = rollDie(6);
	let total = roll1 + roll2 + bonus;
	let text = "";
	let result = {
		total: total,
		dice: `${d6ToEmoji(roll1)} ${d6ToEmoji(roll2)}`
	}
	return result;
}

function fateRoll(bonus) {
	console.log(`Asked to roll Fate-style with ${bonus}`);
	let total = bonus;
	if (Number.isNaN(total)) total = 0;
	let text = "";
	for (let i = 0; i < 4; i++) {
		let roll = rollDie(3) - 2;
		total += roll;
		text += dFToEmoji(roll)
		if (i < 3) {
			text += " ";
		}
	}
	let result = {
		total: total,
		dice: text
	}
	return result;
}

function rollDie(sides) {
		let dieRoll = Math.floor(Math.random() * sides) + 1;
		return dieRoll;
	}

function rollD10() {
	var roll = {
		successes : 0,
		text  : ""
	};

	let die = Math.floor(Math.random() * 10) + 1;
	roll.text = die.toString();
	if (die >= 8) roll.successes++;

	if (die == 10) {
		roll.text += "(";
		do {
			die = Math.floor(Math.random() * 10) + 1;
			roll.text += die + " ";
			if (die >= 8) roll.successes++;

		} while (die == 10)

		roll.text += ")";
	}

	return roll;
}

function rollSTDie(threshold = 8, again = 10) {
	var roll = {
		successes : 0,
		text  : "",
		firstDie: 0
	};

	let die = Math.floor(Math.random() * 10) + 1;
	roll.firstDie = die;
	roll.text = d10ToEmoji(die);
	if (die >= threshold) roll.successes++;

	if (die >= again) {
		roll.text += "(";
		do {
			die = Math.floor(Math.random() * 10) + 1;
			roll.text += d10ToEmoji(die);
			if (die >= threshold) roll.successes++;

		} while (die >= again)

		roll.text += ")";
	}

	return roll;
}

function drawTangledCard(bolstered = false, hindered = false) {
	var roll = {
		successes : 0,
		savage: 0,
		text  : "",
		firstDie: 0
	};

	let die = Math.floor(Math.random() * 6) + 1;
	roll.firstDie = die;
	roll.text = d6ToTangledEmoji(die);
	switch (die) {
		case 1:
			if (hindered) roll.successes--;
			break;
		case 4:
			if (bolstered) roll.successes++;
			break;
		case 5:
			roll.successes++;
			break;
		case 6:
			roll.successes++;
			roll.savage++;
	}

	return roll;
}

function dFToEmoji(number) {
	switch (number) {
		case -1:
			return "<:FateMinus:827077447035781131>";
		case 0:
			return "<:FateBlank:827077447051640893>";
		case 1:
			return "<:FatePlus:827077446976667679>";
	}
}

function d6ToEmoji(number) {
	switch (number) {
		case 1:
			return "<:d6roll1:693649200986062851>";
		case 2:
			return "<:d6roll2:693649186620571658>";
		case 3:
			return "<:d6roll3:693649170661244998>";
		case 4:
			return "<:d6roll4:693649153560936469>";
		case 5:
			return "<:d6roll5:693649115263008829>";
		case 6:
			return "<:d6roll6:693649095734329405>";
	}
}

function d6ToTangledEmoji(number) {
	switch (number) {
		case 1:
			return "<:Hinder:766353146108182608>";
		case 2:
			return "<:Fail:766353161094037554>";
		case 3:
			return "<:Fail:766353161094037554>";
		case 4:
			return "<:Bolster:766353179708227587>";
		case 5:
			return "<:Success:766353101745553458>";
		case 6:
			return "<:Savage:766353126403080212>";
		default:
			return number;
	}
}

function d10ToEmoji(number) {
	switch (number) {
		case 1:
			return "<:1d10red:720382067355025460>";
		case 2:
			return "<:2d10red:720382488194580553>";
		case 3:
			return "<:3d10red:720382507522064504>";
		case 4:
			return "<:4d10red:720382525322559569>";
		case 5:
			return "<:5d10red:720382540623642634>";
		case 6:
			return "<:6d10red:720382556578644108>";
		case 7:
			return "<:7d10red:720382573657981019>";
		case 8:
			return "<:8d10red:720382594360803402>";
		case 9:
			return "<:9d10red:720382616100143204>";
		case 10:
			return "<:10d10red:720382637792952362>";
		default:
			return number;
	}
}

exports.rollPool = rollPool;
exports.pbtaRoll = pbtaRoll;
exports.fateRoll = fateRoll;
exports.drawTangled = drawTangled;
exports.rollDie = rollDie;
exports.rollD10 = rollD10;