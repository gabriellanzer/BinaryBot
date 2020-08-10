//======================BOT=CONFIG======================
//======================vvvvvvvvvv======================

const authToken = "YOUR_TOKEN_HERE"
const mktSymbol = "1HZ100V"
const simulate = true;
const simulationHours = 24;
const simulationCacheFile = "cache.csv"

//======================^^^^^^^^^^======================
//======================BOT=CONFIG======================

// Dependencies
const App = require("./src/binaryBot.js")

// Internal State
let remaining_seconds = simulationHours * 3600;
let end_time = 0;
let start_time = 0;
let ticks_downloaded = 0;
let last_time = 0;
const tck_list = [];

App.Send({
	time: 1
})

App.SingleUse("time", msg => {
	end_time = msg.time;
	ticks_downloaded = 0;
	remaining_seconds = hours * 3600;
	start_time = end_time - Math.min(remaining_seconds, 10000);
	bot.Send({
		ticks_history: mktSymbol,
		adjust_start_time: 1,
		end: end_time,
		start: start_time,
		style: "ticks"
	});
});