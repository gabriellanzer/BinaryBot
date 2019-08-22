require("./ConsoleLogs.js")()

WebSocket = require("ws")

class BinaryApp {
  constructor(url) {
    this.ws = new WebSocket(url)
    this.uses = {}
    this.singleUses = {}
    this.ws.onmessage = this.ChainCall.bind(this)
    this.timeout = 10000
    this.timeoutCounter = this.timeout
    this.authorized = false
    setInterval(this.Ping.bind(this), 4000)
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
      }
    })
    if (onAuthorized) this.SingleUse("authorize", onAuthorized)
  }

  PriceProposal() {
    this.Send({
      proposal: 1,
      amount: 1,
      basis: "payout",
      contract_type: "CALL",
      currency: "USD",
      duration: 60,
      duration_unit: "s",
      barrier: "+0.1",
      symbol: "R_100"
    })
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
    let connected = this.ws.readyState === WebSocket.OPEN
    while (!connected) {
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
