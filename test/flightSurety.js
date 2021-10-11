var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
var Web3 = require('web3')
var url = 'HTTP://127.0.0.1:7545';
var web3 = new Web3(url);

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

    // ARRANGE
    let newAirline = accounts[3];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirline.call(newAirline);

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('(airline) can register an Airline using registerAirline() after it is funded', async () => {

    // ARRANGE
    let newAirline = accounts[3];
    let funding = 10000000000000000000; // 10 ether
    // ACT
    await config.flightSuretyApp.fundAirline(config.firstAirline, {from: config.firstAirline, value: funding});
    // let isOperatingAirline = await config.flightSuretyData.isOperatingAirline.call(config.firstAirline);
    // console.log('isOperatingAirline: ', isOperatingAirline);

    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {
      console.log(e);
    }
    let result = await config.flightSuretyData.isAirline.call(newAirline);

    // ASSERT
    assert.equal(result, true, "Airline should be able to register another airline if it has provided funding");

  });

  it('The fifth airline can be registered with multiparty concensus ', async () => {

    // ARRANGE
    let newAirline1 = accounts[3]
    let newAirline2 = accounts[4];
    let newAirline3 = accounts[5];
    let newAirline4 = accounts[6];

    let funding = 10000000000000000000; // 10 ether
    // ACT

    await config.flightSuretyApp.fundAirline(newAirline1, {from: newAirline1, value: funding});

    await config.flightSuretyApp.registerAirline(newAirline2, {from: config.firstAirline});
    await config.flightSuretyApp.fundAirline(newAirline2, {from: newAirline2, value: funding});
    await config.flightSuretyApp.registerAirline(newAirline3, {from: config.firstAirline});
    await config.flightSuretyApp.fundAirline(newAirline3, {from: newAirline3, value: funding});

    await config.flightSuretyApp.registerAirline(newAirline4, {from: config.firstAirline});
    await config.flightSuretyApp.fundAirline(newAirline4, {from: newAirline4, value: funding});

    let isOperatingAirline = await config.flightSuretyData.isOperatingAirline.call(newAirline4);
    console.log('isOperatingAirline: ', isOperatingAirline);

    let result = await config.flightSuretyData.isAirline.call(newAirline4);

    // ASSERT
    assert.equal(result, true, "New aireline should be able to register using multiparty concensus");

  });

  it('(airline) can be registered, but does not participate in contract until it submits funding of 10 ether', async () => {

    // ARRANGE
    let newAirline5 = accounts[7];
    let funding = 10000000000000000000; // 10 ether
    // ACT
    await config.flightSuretyApp.registerAirline(newAirline5, {from: config.firstAirline});
    let result1 = await config.flightSuretyData.isOperatingAirline.call(newAirline5);

    await config.flightSuretyApp.fundAirline(newAirline5, {from: newAirline5, value: funding});
    let result2 = await config.flightSuretyData.isOperatingAirline.call(newAirline5);


    // ASSERT
    assert.equal(result1, false, "Unfunded airline should not be operational");
    assert.equal(result2, true, "Funded airline should be operational");

  });

});
