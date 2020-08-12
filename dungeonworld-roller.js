
function rollPool(pool)
{
	console.log(`Asked to roll *${pool}*`);
	pool = parseInt(pool);
	if (! Number.isInteger(pool) ) return false;
	console.log(Number.isInteger(pool));
	if (pool < 0 || pool > 50 ) return false;
	var roll = {
		successes : 0,
		text : "",
		dice: pool
	};

	for (let i = 0; i < pool; i++) {
		console.log("rolling");
		currentRoll = rollD10();
		console.log(`currentRoll is ${currentRoll.successes} and ${currentRoll.text}`);
		roll.successes += currentRoll.successes;
		roll.text += currentRoll.text + " ";
		console.log(roll);
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
	//msg.channel.send(`${msg.member} rolled ${dice.d6ToEmoji(roll1)} ${dice.d6ToEmoji(roll2)} : **${total}**`);		
}

function rollDie(sides) {
		dieRoll = Math.floor(Math.random() * sides) + 1;
		return dieRoll;
	}

function d6ToEmoji(number) {
	switch (number) {
		case 1:
			return "<:d6roll1:693941971869499532>";
		case 2:
			return "<:d6roll2:693941953397522462>";
		case 3:
			return "<:d6roll3:693941938168004679>";
		case 4:
			return "<:d6roll4:693941918131814452>";
		case 5:
			return "<:d6roll5:693941904324165712>";
		case 6:
			return "<:d6roll6:693941880920211486>";
	}
}

/*function d6ToEmoji(number) {
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
}*/

function rollD10() {
	var roll = {
		successes : 0,
		text  : ""
	};

	die = Math.floor(Math.random() * 10) + 1;
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

exports.rollPool = rollPool;
exports.pbtaRoll = pbtaRoll;
exports.rollDie = rollDie;
exports.rollD10 = rollD10;
exports.d6ToEmoji = d6ToEmoji;
