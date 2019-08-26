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
