//MACD function returns Histogram, MACD and Signal values array
//the most important (recent) data should be at the end
const macd = require("./indicators/macd.js")

module.exports = function(App) {
  let i = 0
  this.tickList = []
  App.SubscribeTick("R_100", tick => {
    this.tickList.push(tick)
    if (this.tickList.length < 18) {
      console.log(`Bot starting in ${18 - this.tickList.length} ticks...`)
      return
    }
    if (this.tickList.length > 36) this.tickList.splice(0, 1)
    const macdArray = macd(this.tickList, {
      fastEmaPeriod: 6,
      slowEmaPeriod: 14,
      signalEmaPeriod: 4,
      pipSize: 5
    })
    console.logInfo(`MACD - HIST = ${macdArray[0][0]}`)

    i = (i + 1) % 2 //Actions every 2 ticks
    if (i == 0) {
      App.BuyContract(1, {
        symbol: "R_100", //Volatility 100
        currency: "USD", //Same as account
        contract_type: "CALL", //CALL - Going Up
        duration_unit: "t", //Tick
        duration: 1, //1 Tick
        basis: "stake",
        amount: 1
      })
    }
  })

  App.Use("tick", () => {})
}
