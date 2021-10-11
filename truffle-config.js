var HDWalletProvider = require("truffle-hdwallet-provider");
var NonceTrackerSubprovider = require("web3-provider-engine/subproviders/nonce-tracker")

var mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";

module.exports = {
  networks: {
    development: {
      // provider: function () {
      //   var wallet = new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50)
      //   var nonceTracker = new NonceTrackerSubprovider()
      //   wallet.engine._providers.unshift(nonceTracker)
      //   nonceTracker.setEngine(wallet.engine)
      //   return wallet
      // },
      host: "127.0.0.1",
        port: 8545,
        network_id: "*" ,// Match any network id
       networkCheckTimeout: 999999, 
        
    }
  },
  compilers: {
    solc: {
      version: "^0.4.25"
    }
  }
};