BinaryApp = require("./BinaryApp.js");

let App = new BinaryApp("wss://ws.binaryws.com/websockets/v3?app_id=1089");

App.Use('authorize', (msg, next) => { console.log(msg) })
App.Use('ping', (msg, next) => { console.log('Pong!') })


setTimeout(() => {App.Authorize('wgMRHgA5l2MCXbv')}, 1000)

// ws.onopen = function(evt) {
//   ws.send(App.Authorize("wgMRHgA5l2MCXbv"));
// };

// ws.onmessage = function(msg) {
//   var data = JSON.parse(msg.data);
//   console.log("Response: %o", data);
// };

// let stake = 1;

// //Set tick update loop
// setInterval(() => {
//   ws.send(
//     BuyContract(stake, {
//       symbol: "R_100", //Volatility 100
//       currency: "USD", //Same as account
//       contract_type: "CALL", //CALL - Going Up
//       duration_unit: "t", //Tick
//       duration: 1, //1 Tick
//       basis: "stake",
//       amount: stake
//     })
//   );
//   ws.send(SendExpiredContract());
// }, 2000);
