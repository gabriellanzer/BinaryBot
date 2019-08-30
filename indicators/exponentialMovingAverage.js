require("../libs/math")

const exponentialMovingAverage = function(data, config, initVal = 0) {
  const { periods, pipSize } = config

  const weightingMultiplier = 2 / (periods + 1)

  const vals = data

  if (initVal) {
    return (vals[0] - initVal) * weightingMultiplier + initVal
  }

  if (data.length < periods) {
    throw new Error("Periods longer than data length")
  }

  const meanVal = mean(data.slice(0, periods))

  return +vals
    .slice(periods)
    .reduce((prev, e) => (e - prev) * weightingMultiplier + prev, meanVal)
    .toFixed(pipSize)
}

const exponentialMovingAverageArray = function(data, config) {
  const { periods } = config

  let initVal = exponentialMovingAverage(data.slice(0, periods), config)

  return data
    .slice(periods - 1)
    .map((x, i) =>
      !i ? initVal : (initVal = exponentialMovingAverage([x], config, initVal))
    )
}

module.exports = { exponentialMovingAverage, exponentialMovingAverageArray }
