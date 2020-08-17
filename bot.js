//======================BOT=CONFIG======================
//======================vvvvvvvvvv======================

const authToken = "YOUR_TOKEN_HERE"
const mktSymbol = "1HZ100V"

//======================^^^^^^^^^^======================
//======================BOT=CONFIG======================

// Dependencies
const App = require("./src/binaryBot.js")
const ReadLine = require("readline-sync")
const FS = require('fs');

// Internal State
let simulation_seconds = 0;
let remaining_seconds = 0;
let end_time = 0;
let tick_list = [];

console.log("\n");
console.log("==============================================================");
console.log("This is a very advanced Binary Bot! You are lucky to have it!!");
console.log("==============================================================");

// Should Request New Cache
const simulation = ReadLine.keyInYNStrict("Would you like to simulate on a cache file first?");
if (simulation) {
	console.log("\nChecking for existing cache files...");
	const cacheExists = FS.existsSync("./ticks.cache");
	if(!cacheExists)
	{
		console.log("Could not find existing cache file, generating new file!\n");
		GenerateNewCacheFile();
	}
}

function GenerateNewCacheFile() {
	const simulationHours = ReadLine.questionInt("How many hours, starting now, would you like to cache: ");
	console.log(`Querying server for ${simulationHours} hours in ticks!`);
	simulation_seconds = simulationHours * 3600;
	remaining_seconds = simulation_seconds;

	App.SingleUse("time", msg => {
		end_time = msg.time;
		App.Send({
			ticks_history: mktSymbol,
			adjust_start_time: 1,
			end: end_time,
			start: end_time - Math.min(remaining_seconds, 5000),
			style: "ticks"
		});
	});

	App.Use("history", msg => {
		// Remaining size
		end_time -= Math.min(remaining_seconds, 5000);
		remaining_seconds -= Math.min(remaining_seconds, 5000);
		
		// Progress
		const downloadProg = (1.0 - (remaining_seconds/simulation_seconds))*100;
		console.log(`Downloading cache progress: ${downloadProg.toFixed(2)}%`);

		// Append to tick list
		for (let i = 0; i < msg.history.prices.length; i++) {
			const price = msg.history.prices[i];
			const time = msg.history.times[i];
			tick_list.push({
				time: price
			});
		}

		// New Request?
		if (remaining_seconds > 0)
		{
			App.Send({
				ticks_history: mktSymbol,
				adjust_start_time: 1,
				end: end_time,
				start: end_time - Math.min(remaining_seconds, 5000),
				style: "ticks"
			});
		}
		else // Download completed!
		{
			console.log(`Cache download completed... ${tick_list.length} ticks gathered!`);
			console.log(tick_list);
		}
	});

	App.Send({
		time: 1
	})
}