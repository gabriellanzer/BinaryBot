//Proper requirements
require("./libs/math")

//MACD function returns Histogram, MACD and Signal values array
//the most important (recent) data should be at the end
const macd = require("./indicators/macd.js")

module.exports = function(App) {
  let i = 0
  this.tickList = []
  App.SubscribeTick("R_100", tick => {
    this.tickList.push(tick)
    if (this.tickList.length < 17) {
      console.log(`Bot starting in ${17 - this.tickList.length} ticks...`)
      return
    }
    if (this.tickList.length > 34) this.tickList.splice(0, 1)

    if (i == 0) {
      const macdArray = macd(this.tickList, {
        fastEmaPeriod: 6,
        slowEmaPeriod: 14,
        signalEmaPeriod: 4,
        pipSize: 5
      })

      const histValues = new Array(macdArray.length)
      const macdValues = new Array(macdArray.length)
      for (let i = 0; i < macdArray.length; i++) {
        histValues[i] = macdArray[i][0] //Histogram
        macdValues[i] = macdArray[i][2] //MACD
      }

      const reg = linearRegression(macdValues, 6)
      console.logInfo(`HIST - REG = ${reg}`)

      const range = Math.max(histValues) - Math.min(histValues)
      histValues.map(v => v / range) //Normalize values
      const devHist = stddev(histValues)
      console.logInfo(`HIST - STD-DEV = ${devHist}`)
      const fastReg = linearRegression(macdValues, 2)
      if (devHist > 0.05 && Math.abs(reg) > 1.0) {
        i = 1
        if (fastReg > 0) {
          App.BuyContract(1, {
            symbol: "R_100", //Volatility 100
            currency: "USD", //Same as account
            contract_type: "CALL", //CALL - Going Up
            duration_unit: "t", //Tick
            duration: 1, //1 Tick
            basis: "stake",
            amount: 1
          })
        } else {
          App.BuyContract(1, {
            symbol: "R_100", //Volatility 100
            currency: "USD", //Same as account
            contract_type: "PUT", //CALL - Going Up
            duration_unit: "t", //Tick
            duration: 1, //1 Tick
            basis: "stake",
            amount: 1
          })
        }
      }
    } else {
      i = 0 //Actions every 2 ticks
    }
  })

  App.Use("tick", () => {})
}
