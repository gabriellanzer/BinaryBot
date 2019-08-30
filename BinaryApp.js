require("./ConsoleLogs.js")

WebSocket = require("ws")

class BinaryApp {
  constructor(url) {
    this.ws = new WebSocket(url)
    this.uses = {}
    this.singleUses = {}
    this.ws.onmessage = this.ChainCall.bind(this)
    this.timeout = 100000
    this.timeoutCounter = this.timeout
    this.authorized = false
    this.liveContracts = new Map()
    this.resultCallbacks = new Map()
    this.subscribedTicks = new Set()
    this.totalProfit = 0
    this.winCount = 0
    this.lossCount = 0
    this.winLossDiff = 0
    this.maxWin = 0
    this.maxLoss = 0
    this.winLossRation = 0
    setInterval(this.Ping.bind(this), 2000)

    this.Use("authorize", (msg, next) => {
      if (msg.error) {
        console.logError(msg.error.message)
      } else {
        console.logNotify("Authenticated!")
      }
      next()
    })

    this.Use("buy", (msg, next) => {
      if (msg.error) {
        console.logError("Buy failed with message " + msg.error.message)
      } else {
        this.liveContracts.set(msg.buy.contract_id, msg.buy)
      }
      next()
    })

    this.Use("tick", (msg, next) => {
      if (msg.error) {
        console.logError("Error receiving tick update " + msg.error.message)
      }
      next()
    })

    this.Use("transaction", (msg, next) => {
      if (msg.error) {
        console.logError("Transaction error: " + msg.error.message)
      } else {
        const trs = msg.transaction
        if (trs.action == "sell") {
          const contract = this.liveContracts.get(trs.contract_id)
          if (contract == undefined) return //Contract from another bot
          let value = trs.amount - contract.buy_price
          const type = contract.shortcode.split("_")[0]
          const symbol = trs.symbol
          this.totalProfit += value
          this.totalProfit = roundWithPrecision(this.totalProfit, 3)
          value = roundWithPrecision(value, 3)
          if (value > 0) {
            this.winCount++
            if (this.winLossDiff < 0) this.winLossDiff = 0
            this.winLossDiff++
            this.maxWin = Math.max(this.maxWin, this.winLossDiff)
            console.logWin(
              `Sold ${type} contract (${symbol}) with profit: ${value} ${trs.currency} - Win Count ${this.winCount}`
            )
          } else {
            this.lossCount++
            if (this.winLossDiff > 0) this.winLossDiff = 0
            this.winLossDiff--
            this.maxLoss = Math.min(this.maxLoss, this.winLossDiff)
            console.logLoss(
              `Sold ${type} contract (${symbol}) with loss: ${value} ${trs.currency} - Loss Count ${this.lossCount}`
            )
          }
          const callbacks = this.resultCallbacks.get(symbol)
          if (callbacks !== undefined) {
            const params = {
              ...trs,
              buy_price: contract.buy_price,
              payout: contract.payout,
              type: type,
              start_time: contract.start_time,
              shortcode: contract.shortcode,
              profit: value,
              totalProfit: this.totalProfit,
              result: value > 0 ? "WIN" : "LOSS"
            }
            for (let i = 0; i < callbacks.length; i++) {
              callbacks[i](params)
            }
          }
          this.liveContracts.delete(trs.contract_id)
          this.winLossRation = this.winCount / (this.winCount + this.lossCount)
          this.winLossRation = roundWithPrecision(winLossRation, 6)
          console.logInfo(
            `Total Profit: ${this.totalProfit} ${trs.currency} ` +
              `|Win-Loss Ration: ${this.winLossRation * 100.0}% ` +
              `| Max Win: ${this.maxWin} ` +
              `| Max Loss: ${Math.abs(this.maxLoss)}`
          )
        } else if (trs.action == "buy") {
          const contract = this.liveContracts.get(trs.contract_id)
          if (contract == undefined) return //Contract from another bot
          const type = contract.shortcode.split("_")[0]
          console.logWarning(
            `Bought ${type} contract for ${Math.abs(trs.amount)} ${
              trs.currency
            }`
          )
        }
      }
      next()
    })

    this.Use("", (msg, next) => {
      if (msg.error) {
        console.logError(msg.error.message)
      }
      next()
    })
  }

  SubscribeTick(SYMBOL, callback) {
    if (!tickList) tickList = []
    if (!this.subscribedTicks.has(SYMBOL)) {
      this.subscribedTicks.add(SYMBOL)
      this.Send({
        ticks: SYMBOL,
        subscribe: 1
      })
    }
    if (!callback) return
    this.Use("tick", (msg, next) => {
      if (!msg.error) {
        if (msg.tick.symbol === SYMBOL) {
          let value = msg.tick.bid * 0.5 + msg.tick.ask * 0.5
          setTimeout(callback, 1000, value)
        }
      }
      next()
    })
  }

  SubscribeResult(SYMBOL, callback) {
    let callbacks = this.resultCallbacks.get(SYMBOL)
    if (callbacks === undefined) {
      callbacks = new Array()
      this.resultCallbacks.set(SYMBOL, callbacks)
    }
    callbacks.push(callback)
  }

  Authorize(API_KEY, onAuthorized) {
    this.Send({
      authorize: API_KEY
    })
    this.SingleUse("authorize", msg => {
      if (msg.error) {
        console.logError(msg.error.message)
      } else {
        this.authorized = true
        this.Send({
          transaction: 1,
          subscribe: 1
        })
      }
    })
    if (onAuthorized) this.SingleUse("authorize", onAuthorized)
  }

  BuyContract(price, parameters, buy = 1) {
    this.Send({
      buy: buy,
      price: price,
      parameters: parameters
    })
  }

  SendExpiredContract() {
    this.Send({
      sell_expired: 1
    })
  }

  Ping() {
    this.Send({
      ping: 1
    })
  }

  CheckConnection(delay) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (this.ws.readyState === WebSocket.OPEN) {
          resolve(true)
        } else {
          resolve(false)
        }
      }, delay)
    })
  }

  async WaitConnection() {
    this.connected = this.ws.readyState === WebSocket.OPEN
    while (!this.connected) {
      this.connected = await this.CheckConnection(200)
      if (this.connected) {
        this.timeoutCounter = this.timeout
        break
      } else {
        this.timeoutCounter -= 200
        if (this.timeoutCounter <= 0) {
          this.timeoutCounter = this.timeout
          throw "Timed-out while waiting for connection..."
        }
      }
    }
  }

  async Send(data) {
    try {
      await this.WaitConnection()
    } catch (err) {
      console.logError(err)
    }
    try {
      this.ws.send(JSON.stringify(data))
    } catch (err) {
      console.logError("Error sending message: " + err)
    }
  }

  Use(msg_type, callback) {
    if (!callback) throw "Use callback undefined!"
    if (typeof callback !== "function") throw "Use callback is not a function!"
    if (!this.uses[msg_type]) this.uses[msg_type] = []
    this.uses[msg_type][this.uses[msg_type].length] = callback
  }

  SingleUse(msg_type, callback) {
    if (!callback) throw "SingleUse callback undefined!"
    if (typeof callback !== "function")
      throw "SingleUse callback is not a function!"
    if (!this.singleUses[msg_type]) this.singleUses[msg_type] = []
    this.singleUses[msg_type][this.singleUses[msg_type].length] = callback
  }

  ChainCallIt(msg, type, it) {
    if (this.uses[type][it]) {
      this.uses[type][it](
        msg,
        (() => {
          this.ChainCallIt(msg, type, it + 1)
        }).bind(this)
      )
    }
  }

  ChainSingleCall(msg, type) {
    if (this.singleUses[type]) {
      this.singleUses[type].forEach(call => {
        call(msg)
      })
      this.singleUses[type].length = 0
    }
  }

  ChainCall(msg) {
    const data = JSON.parse(msg.data)
    let type = data.msg_type
    if (!this.singleUses[data.msg_type]) {
      type = ""
    }
    this.ChainSingleCall(data, type)

    type = data.msg_type
    if (!this.uses[data.msg_type]) {
      type = ""
    }
    this.ChainCallIt(data, type, 0)
  }
}

module.exports = BinaryApp
