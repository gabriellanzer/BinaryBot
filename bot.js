//======================BOT=CONFIG======================
//======================vvvvvvvvvv======================

const authToken = "YOUR_TOKEN_HERE"
const mktSymbol = "frxUSDJPY"

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
const cachePath = `${__dirname}\\ticks.cache`;

// Cache State
let prices = [];
let times = [];

// Global State
let simulation = false;
// Meta Simulation State
let stdStep = 0.05;
let stdMin;
let stdMax;
let stdFence = stdMin;
let signStep = 0.1;
let signMin;
let signMax;
let signFence = signMin;
let bestRatio = 0;
let initialization = true;
// Simulation State
let result = 0;
let tickIt = 0;
let contracts = [];
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

	const newSlice = tickList.slice(30, 36);
	if (initialization) {
		const std = StdDev(newSlice);
		const mSign = Math.abs(sign);
		if (!stdMin || !stdMax) {
			stdMin = stdMax = std;
		}
		if (!signMin || !signMax) {
			signMin = signMax = mSign;
		}
		if (std < stdMin) {
			stdMin = std;
		}
		if (std > stdMax) {
			stdMax = std;
		}
		if (mSign < signMin) {
			signMin = mSign;
		}
		if (mSign > signMax) {
			signMax = mSign;
		}
		return;
	}

	if (StdDev(newSlice) < stdFence) {
		return;
	}

	if (Math.abs(sign) < signFence) {
		return;
	}

	BuyContract(sign, 3);
}

async function RunBot() {
	simulation = ReadLine.keyInYNStrict("Would you like to simulate on a cache file first?");
	if (simulation) {
		[prices, times] = await GetCache(cachePath, mktSymbol);

		console.log("=======================");
		console.log("STARTING BOT SIMULATION");
		console.log("=======================");

		console.log("\nInitializing parameters...");
		SimulateBot();
		initialization = false;
		console.log(`Found Std Range [${stdMin.toFixed(4)},${stdMax.toFixed(4)}]`);
		console.log(`Found Sign Range [${signMin.toFixed(4)},${signMax.toFixed(4)}]`);

		console.log("\nPerforming Meta Simulation...");

		stdFence = stdMin;
		stdStep = (stdMax - stdMin) / 10.0;
		signFence = signMin;
		signStep = (signMax - signMin) / 10.0;
		while (stdFence < stdMax) {
			while (signFence < signMax) {
				SimulateBot();
				const ration = betsWon / betsCount;
				if (ration > bestRatio) {
					bestRatio = ration;
					console.logInfo(`StdFence=${stdFence}; SignFence=${signFence};`);
					LogResults();
				}
				signFence += signStep;
			}
			let prog = (stdFence - stdMin + stdStep) / (stdMax - stdMin + stdStep);
			console.log("Meta Simulation Progress: " + (prog * 100).toFixed(2) + "%");
			signFence = signMin;
			stdFence += stdStep;
		}
		console.logWin("Meta Simulation finished!\n");
	}
}
RunBot();

function SimulateBot() {
	ResetState();
	for (tickIt = 0; tickIt < prices.length; tickIt++) {
		let newResult = GetTradeResult();
		if (newResult) {
			ComputeStreaks(newResult);
		}
		ProcessTick(prices[tickIt]);
	}
	// LogResults();
}

function ResetState() {
	result = 0;
	tickIt = 0;
	contracts = [];
	winStreak = 0;
	winStreaks = [];
	lossStreak = 0;
	lossStreaks = [];
	betsWon = 0;
	betsCount = 0;
}

function BuyContract(action, delay) {
	contracts[delay - 1] = {
		action: action,
		price: prices[tickIt]
	};
	betsCount++;
}

function GetTradeResult() {
	const contract = contracts.shift();
	if (!contract) {
		return;
	}
	if (contract.price > prices[tickIt]) {
		if (contract.action > 0) {
			return 1;
		} else if (contract.action < 0) {
			return -1;
		}
	} else if (contract.price < prices[tickIt]) {
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