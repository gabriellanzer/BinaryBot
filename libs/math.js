takeField = (arr, field) => arr.map(x => (field ? x[field] : x));

takeLast = (arr, n, field) =>
  takeField(arr.slice(n > arr.length ? 0 : arr.length - n, arr.length), field);

sum = data => data.reduce((acc, x) => acc + x);

mean = data => data.reduce((a, b) => a + b) / data.length;

stddev = data => {
  const dataMean = mean(data);
  const sqDiff = data.map(n => Math.pow(n - dataMean, 2));
  const avgSqDiff = mean(sqDiff);
  return Math.sqrt(avgSqDiff);
};

linearRegression = (data, length) => {
  length = Math.min(data.length, length);
  const regList = data.slice(data.length - length, data.length);
  const regAverage = mean(regList);
  let denominator = 0.0;
  let numerator = 0.0;
  for (let i = 0; i < length; i++) {
    let xDiff = i - length * 0.5;
    let yDiff = regList[i] - regAverage;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }
  const tan = numerator / denominator;
  return Math.atan(tan) * (180.0 / Math.PI);
};

roundWithPrecision = function(num, precision) {
  var multiplier = Math.pow(10, precision);
  return Math.round(num * multiplier) / multiplier;
};

ema = function(data, offset = 0, length = 0) {
  if (length == 0) length = data.length;
  var res = 0;
  var mult = 2.0 / (length + 1);
  for (var i = offset; i < offset + length; i++) {
    res = (data[i] - res) * mult + res;
  }
  return +res;
};

macd = function(data, { slowPeriod = 26, fastPeriod = 12, signalPeriod = 9 }) {
  var totalPeriod = slowPeriod + signalPeriod;
  if (data.length < totalPeriod) {
    console.error(
      "MACD Total Period (" +
        totalPeriod +
        ") is longer than data length (" +
        data.length +
        ")!"
    );
  }
  var periodDif = Math.max(slowPeriod - fastPeriod, 0);
  var macd = [];
  for (var i = 0; i < data.length - slowPeriod; i++) {
    var slow = ema(data, i, slowPeriod);
    var fast = ema(data, i + periodDif, fastPeriod);
    macd.push(+(slow - fast));
  }
  var res = [];
  for (var i = 0; i < macd.length - signalPeriod; i++) {
    var signal = ema(macd, i, signalPeriod);
    var histogram = +(macd[i+signalPeriod-1] - signal); 
    res.push([histogram, macd[i+signalPeriod-1], signal]);
  }
  
  return res;
};
