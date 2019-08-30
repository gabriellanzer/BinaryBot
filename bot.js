//Proper requirements
require("./libs/math")

//MACD function returns Histogram, MACD and Signal values array
//the most important (recent) data should be at the end
const macd = require("./indicators/macd.js")

const dampArray = function(data, length = 0) {
  length = Math.min(data.length, length)
  if (length == 0) length = data.length
  const values = data.slice(data.length - length, data.length)
  const weight = 2.0 / (values.length + 1)
  values.map((x, i) => {
    return x * Math.pow(weight, length - i + 1)
  })
  return values
}

module.exports = function(App) {
  let i = 0
  this.tickList = []
  this.marchingaleLv = 0
  this.iniStake = 0.35
  App.SubscribeTick("R_100", tick => {
    this.tickList.push(tick)

    //Wait for initialization buffer period (for MACD)
    if (this.tickList.length < 17) {
      console.log(`Bot starting in ${17 - this.tickList.length} ticks...`)
      return
    }
    if (this.tickList.length > 34) this.tickList.splice(0, 1)

    //Calculating MACD
    const macdArray = macd(this.tickList, {
      fastEmaPeriod: 4,
      slowEmaPeriod: 14,
      signalEmaPeriod: 2,
      pipSize: 5
    })

    //Decomposing MACD
    const histValues = new Array(macdArray.length)
    const macdValues = new Array(macdArray.length)
    const signValues = new Array(macdArray.length)
    for (let i = 0; i < macdArray.length; i++) {
      histValues[i] = macdArray[i][0] //Histogram
      macdValues[i] = macdArray[i][1] //Signal
      signValues[i] = macdArray[i][2] //MACD
    }

    //Indicators
    const trubReg = linearRegression(dampArray(histValues, 7), 7)
    const fastReg = linearRegression(dampArray(macdValues, 2), 2)
    const slowReg = linearRegression(dampArray(signValues, 4), 4)
    console.logInfo(`==============================`)
    console.logInfo(`HIST - TRUB - REG = ${trubReg}`)
    console.logInfo(`HIST - FAST - REG = ${fastReg}`)
    console.logInfo(`HIST - SLOW - REG = ${slowReg}`)

    if (i == 0) {
      if (Math.abs(trubReg) > 0.3 && Math.abs(slowReg) > 0.9) {
        //Calculate Stake
        let currentStake = iniStake * Math.pow(2.07, marchingaleLv)
        currentStake = currentStake.toPrecision(2)
        i = 1
        if (fastReg > 0) {
          App.BuyContract(currentStake, {
            symbol: "R_100", //Volatility 100
            currency: "USD", //Same as account
            contract_type: "CALL", //CALL - Going Up
            duration_unit: "t", //Tick
            duration: 1, //1 Tick
            basis: "stake",
            amount: currentStake
          })
        } else {
          App.BuyContract(currentStake, {
            symbol: "R_100", //Volatility 100
            currency: "USD", //Same as account
            contract_type: "PUT", //CALL - Going Up
            duration_unit: "t", //Tick
            duration: 1, //1 Tick
            basis: "stake",
            amount: currentStake
          })
        }
      }
    } else {
      i = (i + 1) % 2 //Actions every 3 ticks
    }
  })

  App.SubscribeResult("R_100", ({ result }) => {
    if (result == "WIN") {
      this.marchingaleLv = 0
    } else {
      this.marchingaleLv++
    }
  })
}
