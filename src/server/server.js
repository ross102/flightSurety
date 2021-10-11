import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';

import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let firstAirline = '0xF014343BDFFbED8660A9d8721deC985126f189F3';
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress, firstAirline);

let noPayoutStatusCodes = [0, 10, 30, 40, 50];
let initialOracleCount = 20;
let oracles = [];
let accounts = [];
// e.g. oracles = [
// {account:'0x37c978a96C4Aa1a478af332a91a8b38e610F52bD', indexes: [1, 2, 3]},
// {account: '0xBC1CA65B14d1B1a7f237f199E485CB34b5D79377', indexes: [1, 3, 5]},
// ]

const authorizeCaller = async () => {
  accounts = await web3.eth.getAccounts();
  await flightSuretyData.methods.authorizeCaller(config.appAddress).send({
    from: accounts[0],
    gas: 1000000,
  });
}

const registerOracles = async () => {
  accounts = await web3.eth.getAccounts();
  for(let i = 20; i < 20 + initialOracleCount; i++) {
    registerOracle(accounts[i]);
  }
};

const registerOracle = async (account) => {
    await flightSuretyApp.methods.registerOracle().send({
      from: account,
      value: web3.utils.toWei('1', 'ether'),
      gas: 1000000,
    }, async (err, result) => {
      if (err) {
        console.log(err.message);
      } else {
        console.log('registered oracle: ', account);
        let indexes = await flightSuretyApp.methods.getMyIndexes().call({
          "from": account,
          "gas": 100000,
        });
        oracles.push({
          account: account,
          indexes,
        });
        console.log('Oracle account: ', account, 'indexes: ', indexes);
      }
    });
};

const submitOracleResponses = async (event) => {
  const index = event.returnValues.index;
  const airline = event.returnValues.airline;
  const flight = event.returnValues.flight;
  const timestamp = event.returnValues.timestamp;
  const oracles = getOraclesForIndex(index);

  console.log(`oracles for index ${index}: `, oracles );

  for(let i = 0; i < oracles.length; i++) {
    let statusCode = getRandomFlightStatus();
    try {
      await flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, statusCode).send({
        from: oracles[i],
        gas: 100000,
      });
    } catch (err) {
      console.log('submit response error for oracle: ', oracles[i]);
      console.log(err.message);
    }
  }
};

const getOraclesForIndex = (index) => {
  let oraclesForIndex = [];
  oracles.forEach(oracle => {
    oracle.indexes.forEach(i => {
      if(i == index) {
        oraclesForIndex.push(oracle.account);
      }
    })
  });
  return oraclesForIndex;
};

flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, async function (error, event) {
    if (error) console.log(error);
    console.log(event.event);
    submitOracleResponses(event);
});

const getRandomFlightStatus = () => {
  let randomNumber = Math.floor(Math.random() * 10);
  if(randomNumber < 6) {
    return 20; // 60% chance airline needs to pay passenger
  } else {
    let randomDelayNumber = Math.floor(Math.random() * 5);
    return noPayoutStatusCodes[randomDelayNumber]; // 40% chance no need to pay passenger
  }
};

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

// authorizeCaller();

registerOracles();

export default app;

