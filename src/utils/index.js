const _ = require('lodash');
const axios = require('axios').default;

function loadEthRPCschema() {
  const ETH_OPEN_RPC = require('../eth-openrpc.json');
  const ETH_METHODS = _.groupBy(ETH_OPEN_RPC.methods, 'name');
  for(let key in ETH_METHODS) {
    ETH_METHODS[key] = ETH_METHODS[key][0];
  }
  return ETH_METHODS;
}

async function waitTx(txHash) {
  let tryTime = 3000;
  while(tryTime > 0) {
    let tx = await web3.eth.getTransactionReceipt(txHash);
    if (tx) {
      return tx;
    }
    await waitNS();
    tryTime -= 1;
  }
}

function waitNS(n = 1) {
  return new Promise(resolve => setTimeout(resolve, n * 1000));
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';
const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

async function request(url, req) {
  req.jsonrpc = '2.0';
  req.id = `${Date.now()}-${_.random(0, 100000)}`;
  const { data } = await axios.post(url, req);
  return data;
}

module.exports = {
  waitTx,
  loadEthRPCschema,
  ZERO_ADDRESS,
  ZERO_HASH,
  ERC20_TRANSFER_TOPIC,
  request,
}