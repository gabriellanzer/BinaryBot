const macd = require('./indicators/macd.js')


module.exports = function(App) {
  this.tickList = []
  App.SubscribeTick("R_100", (tick) => {
    this.tickList.push(tick)
    if(this.tickList.length > 34) {
      this.tickList.splice(0,1)
      const macdArray = macd(this.tickList, { fastEmaPeriod: 12, slowEmaPeriod: 26,
        signalEmaPeriod: 9, pipSize: 5 })
      console.log(macdArray)
    }

  })

  let i = 0
  App.Use("tick", () => {
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
  })
}
