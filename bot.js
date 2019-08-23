module.exports = function(App) {
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
