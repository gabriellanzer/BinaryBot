const BinaryApp = require("./BinaryApp.js")
const path = require("path")
const readline = require("readline-sync")
require("./ConsoleLogs.js")()

let App = new BinaryApp("wss://ws.binaryws.com/websockets/v3?app_id=1089")

let stdin = process.openStdin()

//Commands function
function terminalCommands(input) {
  const data = input.toString().trim()
  if (data == "balance") {
    App.Send({
      balance: 1,
      subscribe: 0
    })
    App.SingleUse("balance", msg => {
      console.logInfo(
        `Current Balance = ${msg.balance.balance} ${msg.balance.currency}`
      )
    })
  }
  if (data == "auth") {
    requestAuth()
  }
}

//Request bot file
let bot = undefined
do {
  let botPath = readline.question("Specify a bot file (bot.js):")
  if (botPath.length == 0) {
    botPath = "bot.js"
  }
  const botFilePath = path.resolve(path.join(__dirname, botPath))
  try {
    bot = require(botFilePath)
  } catch (err) {
    console.logError(err)
  }
} while (bot === undefined)

//Request auth code
function requestAuth() {
  authToken = readline.question(
    "Insert API Token (get from Settings > Security & Limits):"
  )
  App.Authorize(authToken, msg => {
    if (msg.error) {
      process.exit(403)
    }
    stdin.addListener("data", terminalCommands)
  })
}
requestAuth()

//Start bot
bot(App)