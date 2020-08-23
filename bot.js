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

// Constants
const cache_path = "./ticks.cache";

console.log("\n");
console.log("==============================================================");
console.log("This is a very advanced Binary Bot! You are lucky to have it!!");
console.log("==============================================================");

async function runBot() {
	const simulation = ReadLine.keyInYNStrict("Would you like to simulate on a cache file first?");
    if (simulation) {
		console.log(await GetCache(cache_path))
    }
}
runBot();

