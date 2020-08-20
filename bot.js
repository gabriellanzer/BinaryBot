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

// Constants
const cache_path = "./ticks.cache";

// Internal State
let simulation_seconds = 0;
let remaining_seconds = 0;
let end_time = 0;
let price_list = [];
let time_list = [];

console.log("\n");
console.log("==============================================================");
console.log("This is a very advanced Binary Bot! You are lucky to have it!!");
console.log("==============================================================");

// Should Request New Cache
const simulation = ReadLine.keyInYNStrict("Would you like to simulate on a cache file first?");
if (simulation) {
	console.log("\nChecking for existing cache files...");
	const cacheExists = FS.existsSync(cache_path);
	let forceRegen = false;
	if (cacheExists) {
		forceRegen = !ReadLine.keyInYNStrict("Cache found! Use existing cache it (y), or generate new(n)?")
	} else {
		console.log("Could not find existing cache file, generating new file!");
	}
	if (!cacheExists || forceRegen) {
		GenerateNewCacheFile();
	} else {
		ReadCacheFile();
	}
}

function ReadCacheFile() {
	let fileBuff = FS.readFileSync(cache_path);
	let lstPos = 0;
	let lnPos = fileBuff.indexOf("\n", byteOffset = lstPos);
	const iniDate = new Date(fileBuff.slice(lstPos, lnPos).toString());
	lstPos = lnPos + 1;
	lnPos = fileBuff.indexOf("\n", byteOffset = lstPos);
	const lastDate = new Date(fileBuff.slice(lstPos, lnPos).toString());
	lstPos = lnPos + 1;
	lnPos = fileBuff.indexOf("\n", byteOffset = lstPos);
	const tickCount = parseInt(fileBuff.slice(lstPos, lnPos));
	console.log(
		"Using Cache from '" + iniDate.toUTCString() + "' to '" +
		lastDate.toUTCString() + "' with " + tickCount + " Ticks!"
	);
	lstPos = lnPos + 1;
	price_list = new Float32Array(fileBuff, lstPos, tickCount);
	lstPos += Float32Array.BYTES_PER_ELEMENT * tickCount;
	time_list = new Int32Array(fileBuff, lstPos, tickCount);
	console.log(price_list);
	console.log(time_list);
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
		const downloadProg = (1.0 - (remaining_seconds / simulation_seconds)) * 100;
		console.log(`Downloading cache progress: ${downloadProg.toFixed(2)}%`);

		// Append to tick list
		const history = msg.history;
		for (let i = 0; i < history.prices.length; i++) {
			price_list.push(parseFloat(history.prices[i]));
			time_list.push(parseInt(history.times[i]));
		}

		// New Request?
		if (remaining_seconds > 0) {
			App.Send({
				ticks_history: mktSymbol,
				adjust_start_time: 1,
				end: end_time,
				start: end_time - Math.min(remaining_seconds, 5000),
				style: "ticks"
			});
		} else // Download completed!
		{
			console.log(`Cache download completed... ${price_list.length} ticks gathered!`);
			const wrStream = FS.createWriteStream(cache_path);
			const iniTime = new Date(time_list[0] * 1000);
			const lastTime = new Date(time_list[time_list.length - 1] * 1000);
			wrStream.write(`${iniTime}\n${lastTime}\n${time_list.length}\n`);
			wrStream.write(Buffer.from(Float32Array.from(price_list)));
			wrStream.write(Buffer.from(Int32Array.from(time_list)));
			wrStream.close();
			
		}
	});

	App.Send({
		time: 1
	})
}