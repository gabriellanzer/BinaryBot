// Thir party dependencies
const path = require("path");
const readline = require("readline-sync");

// Internal dependencies
require("./src/consoleLogs.js");
const App = require("./src/binaryBot.js");

//Request bot file
let bot = undefined;
let botPath = undefined;
let botFullPath = undefined;
do {
	botPath = readline.question("Specify a bot file (bot.js):");
	if (botPath.length == 0) {
		botPath = "bot.js";
	}
	botFullPath = path.resolve(path.join(__dirname, botPath));

	try {

		// Insert bot information on App
		App.botPath = botPath;
		App.botFullPath = botFullPath;

		// Start bot
		console.logInfo("Starting trade bot (" + botFullPath + ")...");
		bot = require(botFullPath);

	} catch (err) {
		console.logError("Error loading bot!");
		console.logError(err);
	}
} while (bot === undefined);

return 0;