takeField = (arr, field) => arr.map(x => (field ? x[field] : x))

takeLast = (arr, n, field) =>
  takeField(arr.slice(n > arr.length ? 0 : arr.length - n, arr.length), field)

sum = data => data.reduce((acc, x) => acc + x)

mean = data => data.reduce((a, b) => a + b) / data.length

stddev = data => {
  const dataMean = mean(data)
  const sqDiff = data.map(n => Math.pow(n - dataMean, 2))
  const avgSqDiff = mean(sqDiff)
  return Math.sqrt(avgSqDiff)
}

linearRegression = (data, length) => {
  length = Math.min(data.length, length)
  const regList = data.slice(data.length - length, data.length)
  const regAverage = mean(regList)
  let denominator = 0.0
  let numerator = 0.0
  for (let i = 0; i < length; i++) {
    let xDiff = i - length * 0.5
    let yDiff = regList[i] - regAverage
    numerator += xDiff * yDiff
    denominator += xDiff * xDiff
  }
  const tan = numerator / denominator
  return Math.atan(tan) * (180.0 / Math.PI)
}
