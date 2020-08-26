//======================BOT=CONFIG======================
//======================vvvvvvvvvv======================

const authToken = "YOUR_TOKEN_HERE"
const mktSymbol = "1HZ100V"

//======================^^^^^^^^^^======================
//======================BOT=CONFIG======================

// Dependencies
const App = require("./src/binaryBot");
const ReadLine = require("readline-sync");
const GetCache = require("./src/cacheManager");
require("./libs/math");

// Constants
const cachePath = "./ticks.cache";

// State
let action = 0;
let result = 0;
let winStreak = 0;
let winStreaks = [];
let lossStreak = 0;
let lossStreaks = [];
let betsWon = 0;
let betsCount = 0;

console.log("\n");
console.log("==============================================================");
console.log("This is a very advanced Binary Bot! You are lucky to have it!!");
console.log("==============================================================");

async function RunBot() {
	const simulation = ReadLine.keyInYNStrict("Would you like to simulate on a cache file first?");
	if (simulation) {
		const [prices, times] = await GetCache(cachePath, mktSymbol);

		console.log("=======================");
		console.log("STARTING BOT SIMULATION");
		console.log("=======================");
		SimulateBot(prices, times);
	}
}
RunBot();

function SimulateBot(prices, times) {
	for (let i = 0; i < prices.length; i++) {
		let newResult = ProcessBuy(action, prices, i);
		if (result != 0 && result != newResult) {
			if (result > 0) {
				if (!winStreaks[winStreak])
					winStreaks[winStreak] = 0
				winStreaks[winStreak]++;
			} else if (result < 0) {
				if (!lossStreaks[lossStreak])
					lossStreaks[lossStreak] = 0
				lossStreaks[lossStreak]++;
			}
			winStreak = 0;
			lossStreak = 0;
		}
		if (newResult > 0) {
			betsWon++;
			winStreak++;
		} else if (newResult < 0) {
			lossStreak++;
		}
		result = newResult;
		action = ProcessTick(prices[i], times[i]);
		if (action != 0) {
			betsCount++;
		}
	}
	console.logInfo(`Bets Made: ${betsCount}`)
	console.logInfo(`Win Ratio: ${(betsWon/betsCount*100.0).toFixed(2)}% => ${betsWon}/${betsCount}`)
	let winStreakInfo = "";
	for (let i = 1; i < winStreaks.length; i++) {
		if (!winStreaks[i]) continue;
		winStreakInfo += `(${i}:${winStreaks[i]});`;
	}
	console.logInfo(`Win Streaks: ${winStreakInfo}`)
	let lossStreakInfo = "";
	for (let i = 1; i < lossStreaks.length; i++) {
		if (!lossStreaks[i]) continue;
		lossStreakInfo += `(${i}:${lossStreaks[i]});`;
	}
	console.logInfo(`Loss Streaks: ${lossStreakInfo}`)
}

let tickList = [];

function ProcessTick(price, time) {
	tickList.push(price);
	if (tickList.length <= 36)
		return 0;
	tickList.shift();
	const [hist, val, sign] = macd(tickList)[0];
	if (sign < 3.1 && sign > -3.1)
		return 0;
	return sign;
}

function ProcessBuy(action, prices, it) {
	if (action == 0)
		return 0;

	if (action > 0) {
		if (prices[it] > prices[it - 1]) {
			return 1;
		}
		return -1;
	} else {
		if (prices[it] < prices[it - 1]) {
			return 1;
		}
		return -1;
	}
}