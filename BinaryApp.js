WebSocket = require("ws");

class BinaryApp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.uses = {};
    setInterval(this.Ping.bind(this), 4000);
    this.ws.onmessage = this.ChainCall.bind(this);
  }

  Use(msg_type, callback) {
    if (!this.uses[msg_type]) this.uses[msg_type] = [];
    this.uses[msg_type][this.uses[msg_type].length] = callback;
  }

  ChainCall(msg) {
    const data = JSON.parse(msg.data);
    if (!this.uses[data.msg_type]) return;
    if (this.uses[data.msg_type][0]) {
      this.uses[data.msg_type][0](
        data,
        this.uses[data.msg_type][1] ? this.uses[data.msg_type][1] : () => {}
      );
    }
  }

  Authorize(API_KEY) {
    this.ws.send(
      JSON.stringify({
        authorize: API_KEY
      })
    );
  }

  PriceProposal() {
    this.ws.send(
      JSON.stringify({
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
    );
  }

  BuyContract(price, parameters, buy = 1) {
    thiw.ws.send(
      JSON.stringify({
        buy: buy,
        price: price,
        parameters: parameters
      })
    );
  }

  SendExpiredContract() {
    thiw.ws.send(
      JSON.stringify({
        sell_expired: 1
      })
    );
  }

  Ping() {
    this.ws.send(
      JSON.stringify({
        ping: 1
      })
    );
  }
}

module.exports = BinaryApp;
