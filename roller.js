
	exports.rollPool = function(pool)
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
			currentRoll = rollDie();
			console.log(`currentRoll is ${currentRoll.successes} and ${currentRoll.text}`);
			roll.successes += currentRoll.successes;
			roll.text += currentRoll.text + " ";
			console.log(roll);
		}

		return roll;

	}

	function rollDie() {
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
