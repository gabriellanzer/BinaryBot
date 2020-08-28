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
const {
	MACD,
	StdDev,
	Sum,
	EMA,
	LinearReg,
	Mean
} = require("./src/math");

// Constants
const cachePath = "./ticks.cache";

// Cache State
let prices = [];
let times = [];

// State
let simulation = false;
let action = 0;
let result = 0;
let tickIt = 0;
let contracts = {};
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

let tickList = [];

function ProcessTick(price) {
	tickList.push(price);
	if (tickList.length <= 36)
		return 0;
	tickList.shift();
	const [
		[hist, val, sign]
	] = MACD(tickList);

	if (sign < 4.1 && sign > -4.1)
		return 0;

	BuyContract(sign, 1);
	return sign;
}

async function RunBot() {
	simulation = ReadLine.keyInYNStrict("Would you like to simulate on a cache file first?");
	if (simulation) {
		[prices, times] = await GetCache(cachePath, mktSymbol);

		console.log("=======================");
		console.log("STARTING BOT SIMULATION");
		console.log("=======================");
		SimulateBot();
	}
}
RunBot();

function SimulateBot() {
	for (tickIt = 0; tickIt < prices.length; tickIt++) {
		let newResult = GetTradeResult();
		console.log(newResult);
		if (newResult) {
			ComputeStreaks(newResult);
		}
		ProcessTick(prices[tickIt], times[tickIt]);
	}
	LogResults();
}

function BuyContract(action, delay) {
	contracts[(times[tickIt] + delay).toString()] = {
		action: action,
		price: prices[tickIt]
	};
	betsCount++;
}

function GetTradeResult() {
	const timeStr = times[tickIt].toString();
	const contract = contracts[timeStr];
	if (!contract) {
		return;
	}
	delete contracts[timeStr];
	console.log(contract, timeStr);
	let curPrice = prices[tickIt];
	if (contract.price > curPrice) {
		if (contract.action > 0) {
			return 1;
		} else if (contract.action < 0) {
			return -1;
		}
	} else if (contract.price < curPrice) {
		if (contract.action < 0) {
			return 1;
		} else if (contract.action > 0) {
			return -1;
		}
	}
	return -1;
}

function ComputeStreaks(newResult) {
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
}

function LogResults() {
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