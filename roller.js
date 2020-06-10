
	exports.rollPool = function(pool, again = 10)
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
			let currentRoll = rollDie(10, again);
			roll.successes = currentRoll.successes;
			roll.text = currentRoll.text;
			if (currentRoll.firstDie == 1) roll.successes = -1;
			return roll;
		}

		for (let i = 0; i < pool; i++) {
			let currentRoll = rollDie(8, again);
			roll.successes += currentRoll.successes;
			roll.text += currentRoll.text;
		}

		return roll;

	}

	function rollDie(threshold = 8, again = 10) {
		var roll = {
			successes : 0,
			text  : "",
			firstDie: 0
		};

		die = Math.floor(Math.random() * 10) + 1;
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

