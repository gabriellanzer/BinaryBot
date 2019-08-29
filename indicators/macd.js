const {
  exponentialMovingAverageArray
} = require("./exponentialMovingAverage.js")

//type CandleField = 'open' | 'high' | 'low' | 'close';

// type MacdConfig = {
//     fastEmaPeriod: number,
//     slowEmaPeriod: number,
//     signalEmaPeriod: number,
//     pipSize: number,
// };

// type MacdEntry = number[];

const paddingLeft = function(data, length) {
  const arr = []
  arr.length = length - data.length
  arr.fill(0)
  return [...arr, ...data]
}

const macdArray = function(data, config) {
  const { fastEmaPeriod, slowEmaPeriod, signalEmaPeriod, pipSize } = config

  const vals = data

  const length = vals.length

  const fastEmaArray = paddingLeft(
    exponentialMovingAverageArray(
      vals,
      { periods: fastEmaPeriod, pipSize: 20 }
      // -------------------------- ^ set pipSize to 20 to prevent rounding
    ),
    length
  )
  const slowEmaArray = paddingLeft(
    exponentialMovingAverageArray(vals, {
      periods: slowEmaPeriod,
      pipSize: 20
    }),
    length
  )

  const macdCalcArray = paddingLeft(
    slowEmaArray.map((x, i) => +(fastEmaArray[i] - x).toFixed(pipSize)),
    length
  )

  const signalEmaArray = paddingLeft(
    exponentialMovingAverageArray(macdCalcArray.slice(slowEmaPeriod - 1), {
      periods: signalEmaPeriod,
      pipSize: 20
    }),
    length
  )

  return macdCalcArray
    .map((x, i) => [
      +(x - signalEmaArray[i]).toFixed(pipSize),
      x,
      +signalEmaArray[i].toFixed(pipSize)
    ])
    .slice(slowEmaPeriod + signalEmaPeriod - 2)
}

module.exports = macdArray
