const chalk = require("chalk")

//Setup Error Log Routines
function Setup() {
 console.logError = function(msg) {
   this.log(chalk.bgRed.whiteBright.bold("Error >") + " " + chalk.reset.redBright(msg))
 }
 console.logWarning = function(msg) {
   this.log(chalk.bgYellowBright.gray.bold("Warning >") + " " + chalk.reset.yellowBright(msg))
 }
 console.logInfo = function(msg) {
   this.log(chalk.bgBlue.whiteBright.bold("Info >") + " " + chalk.reset.white(msg))
 }
 console.logNotify = function(msg) {
   this.log(chalk.bgGreen.whiteBright.bold("Notify >") + " " + chalk.reset.greenBright(msg))
 }
 console.logWin = function(msg) {
   this.log(chalk.bgGreen.whiteBright.bold("Win >") + " " + chalk.reset.greenBright(msg))
 }
 console.logLoss = function(msg) {
   this.log(chalk.bgRed.whiteBright.bold("Loss >") + " " + chalk.reset.redBright(msg))
 }
}

module.exports = Setup