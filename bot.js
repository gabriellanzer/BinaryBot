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
let emaMin;
let emaMax;
let emaFence = emaMin;
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
let signList = [];

function ProcessTick(price) {
	tickList.push(price);
	if (tickList.length <= 36)
		return;
	tickList.shift();
	const [
		[hist, val, sign]
	] = MACD(tickList);

	signList.push(sign);
	if (signList.length <= 9)
		return;
	signList.shift();

	const tickSlice = tickList.slice(18, 36);
	if (initialization) {
		const tickEma = EMA(tickSlice);
		const signStdDev = StdDev(signList);
		if (!emaMin || !emaMax) {
			emaMin = emaMax = tickEma;
		}
		if (!signMin || !signMax) {
			signMin = signMax = signStdDev;
		}
		if (tickEma < emaMin) {
			emaMin = tickEma;
		}
		if (tickEma > emaMax) {
			emaMax = tickEma;
		}
		if (signStdDev < signMin) {
			signMin = signStdDev;
		}
		if (signStdDev > signMax) {
			signMax = signStdDev;
		}
		return;
	}

	if (EMA(tickSlice) < emaFence) {
		return;
	}

	if (StdDev(signList) < signFence) {
		return;
	}

	BuyContract(EMA(signList), 24);
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
		console.log(`Found Std Range [${emaMin.toFixed(4)},${emaMax.toFixed(4)}]`);
		console.log(`Found Sign Range [${signMin.toFixed(4)},${signMax.toFixed(4)}]`);

		console.log("\nPerforming Meta Simulation...");

		emaFence = emaMin;
		stdStep = (emaMax - emaMin) / 10.0;
		signFence = signMin;
		signStep = (signMax - signMin) / 10.0;
		while (emaFence < emaMax) {
			while (signFence < signMax) {
				SimulateBot();
				const ration = betsWon / betsCount;
				if (ration > bestRatio) {
					bestRatio = ration;
					console.logInfo(`StdFence=${emaFence}; SignFence=${signFence};`);
					LogResults();
				}
				signFence += signStep;
			}
			let prog = (emaFence - emaMin + stdStep) / (emaMax - emaMin + stdStep);
			console.log("Meta Simulation Progress: " + (prog * 100).toFixed(2) + "%");
			signFence = signMin;
			emaFence += stdStep;
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
	ComputeFinalStreaks();
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
		} else if (result <= 0) {
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
	} else if (newResult <= 0) {
		lossStreak++;
	}
	result = newResult;
}

function ComputeFinalStreaks() {
	if (!winStreaks[winStreak])
		winStreaks[winStreak] = 0
	winStreaks[winStreak]++;
	if (!lossStreaks[lossStreak])
		lossStreaks[lossStreak] = 0
	lossStreaks[lossStreak]++;
}

function LogResults() {
	console.logInfo(`Bets Made: ${betsCount}`)
	console.logInfo(`Win Ratio: ${(betsWon/betsCount*100.0).toFixed(2)}% => ${betsWon}/${betsCount}`)
	let winStreakInfo = "";
	for (let i = 1; i < winStreaks.length; i++) {
		if (!winStreaks[i]) continue;
		winStreakInfo += `(${i}:${winStreaks[i]});`;
	}
	if (winStreaks.length == 0) {
		winStreakInfo = "None!";
	}
	console.logInfo(`Win Streaks: ${winStreakInfo}`)
	let lossStreakInfo = "";
	for (let i = 1; i < lossStreaks.length; i++) {
		if (!lossStreaks[i]) continue;
		lossStreakInfo += `(${i}:${lossStreaks[i]});`;
	}
	if (lossStreak.length == 0) {
		lossStreakInfo = "None!";
	}
	console.logInfo(`Loss Streaks: ${lossStreakInfo}`)
}