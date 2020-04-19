
	exports.rollPool = function(pool)
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
			let currentRoll = rollDie(10);
			roll.successes = currentRoll.successes;
			roll.text = currentRoll.text;
			if (currentRoll.firstDie == 1) roll.successes = -1;
			return roll;
		}

		for (let i = 0; i < pool; i++) {
			let currentRoll = rollDie();
			roll.successes += currentRoll.successes;
			roll.text += currentRoll.text + " ";
		}

		return roll;

	}

	function rollDie(threshold = 8) {
		var roll = {
			successes : 0,
			text  : "",
			firstDie: 0
		};

		die = Math.floor(Math.random() * 10) + 1;
		roll.firstDie = die;
		roll.text = die.toString();
		if (die >= threshold) roll.successes++;

		if (die == 10) {
			roll.text += "(";
			do {
				die = Math.floor(Math.random() * 10) + 1;
				roll.text += die + " ";
				if (die >= threshold) roll.successes++;

			} while (die == 10)

			roll.text += ")";
		}

		return roll;
	}
