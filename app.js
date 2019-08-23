const BinaryApp = require("./BinaryApp.js")
const path = require("path")
const readline = require("readline-sync")
require("./ConsoleLogs.js")()

let App = new BinaryApp("wss://ws.binaryws.com/websockets/v3?app_id=1089")

App.Use("authorize", (msg, next) => {
  if (msg.error) {
    console.logError(msg.error.message)
  } else {
    console.logNotify("Authenticated!")
  }
  next()
})

App.Use("buy", (msg, next) => {
  if (msg.error) {
    console.logError("Buy failed with message " + msg.error.message)
  } else {
    liveContracts.set(msg.buy.contract_id, msg.buy)
  }
  next()
})

App.Use("tick", (msg, next) => {
  if (msg.error) {
    console.logError("Error receiving tick update " + msg.error.message)
  } else {
    //console.logInfo("Tick Value Received: " + msg.tick.quote)
  }
  next()
})

const liveContracts = new Map()
App.Use("transaction", (msg, next) => {
  if (msg.error) {
    console.logError("Transaction error: " + msg.error.message)
  } else {
    const trs = msg.transaction
    if (trs.action == "sell") {
      const value = trs.amount - liveContracts.get(trs.contract_id).buy_price
      if (value > 0) {
        console.logWin(`Sold contract with profit: ${value} ${trs.currency}`)
      } else {
        console.logLoss(`Sold contract with loss: ${value} ${trs.currency}`)
      }
      liveContracts.delete(trs.contract_id)
    } else if (trs.action == "buy") {
      console.logWarning(
        `Bought contract for ${Math.abs(trs.amount)} ${trs.currency}`
      )
    }
  }
  next()
})

App.Use("", (msg, next) => {
  if (msg.error) {
    console.logError(msg.error.message)
  }
  next()
})

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

    App.Send({
      ticks: "R_100"
    })
    App.Send({
      transaction: 1,
      subscribe: 1
    })
    stdin.addListener("data", terminalCommands)
  })
}
requestAuth()

bot(App)