require("./ConsoleLogs.js")()

BinaryApp = require("./BinaryApp.js")

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

let i = 0
App.Use("tick", (msg, next) => {
  i = (i + 1) % 2 //Actions every 2 ticks
  if (i == 0) {
    App.BuyContract(10, {
      symbol: "R_100", //Volatility 100
      currency: "USD", //Same as account
      contract_type: "CALL", //CALL - Going Up
      duration_unit: "t", //Tick
      duration: 1, //1 Tick
      basis: "stake",
      amount: 1
    })
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

App.Authorize("wgMRHgA5l2MCXbv", msg => {
  App.Send({
    ticks: "R_100"
  })
  App.Send({
    transaction: 1,
    subscribe: 1
  })
})

let stdin = process.openStdin()

stdin.addListener("data", function(input) {
  const data = input.toString().trim()
  if (data == "balance") {
    App.Send({
      "balance": 1,
      "subscribe": 0
    })
    App.SingleUse("balance", (msg) => {
      console.logInfo(
        `Current Balance = ${msg.balance.balance} ${msg.balance.currency}`
      )
    })
  }
})
