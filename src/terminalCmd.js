const readline = require("readline-sync")

module.exports = (App) =>
{
  return function(input) {
    const data = input.toString().trim()
    switch (data) {
      case 'balance':
        App.Send({
          balance: 1,
          subscribe: 0
        })
        App.SingleUse("balance", msg => {
          console.logInfo(
            `Current Balance = ${msg.balance.balance} ${msg.balance.currency}`
          )
        })
        break;
  
      case 'auth':
        let authToken = readline.question(
          "Insert API Token (get from Settings > Security & Limits):"
        )
        App.Authorize(authToken, msg => {
          if (msg.error) {
            console.logError(msg.error)
          }
        })
        break;
  
      default:
        console.logInfo
        break;
    }
  }
}
