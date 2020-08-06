const chalk = require("chalk")

//Setup Error Log Routines
console.logError = function (msg) {
  let text = msg;
  if (msg !== undefined && msg.stack !== undefined) {
    text = msg.stack;
  }
  this.log(
    chalk.bgRed.whiteBright.bold("Error >") + " " + chalk.bold.redBright(text)
  )
}
console.logWarning = function (msg) {
  let text = msg;
  if (msg !== undefined && msg.stack !== undefined) {
    text = msg.stack;
  }
  this.log(
    chalk.bgYellowBright.gray.bold("Warning >") +
    " " +
    chalk.reset.yellowBright(text)
  )
}
console.logInfo = function (msg) {
  let text = msg;
  if (msg !== undefined && msg.stack !== undefined) {
    text = msg.stack;
  }
  this.log(
    chalk.bgBlue.whiteBright.bold("Info >") + " " + chalk.reset.white(text)
  )
}
console.logNotify = function (msg) {
  let text = msg;
  if (msg !== undefined && msg.stack !== undefined) {
    text = msg.stack;
  }
  this.log(
    chalk.bgGreen.whiteBright.bold("Notify >") +
    " " +
    chalk.reset.greenBright(text)
  )
}
console.logWin = function (msg) {
  let text = msg;
  if (msg !== undefined && msg.stack !== undefined) {
    text = msg.stack;
  }
  this.log(
    chalk.bgGreen.whiteBright.bold("Win >") + " " + chalk.bold.greenBright(text)
  )
}
console.logLoss = function (msg) {
  let text = msg;
  if (msg !== undefined && msg.stack !== undefined) {
    text = msg.stack;
  }
  this.log(
    chalk.bgRed.whiteBright.bold("Loss >") + " " + chalk.reset.redBright(text)
  )
}