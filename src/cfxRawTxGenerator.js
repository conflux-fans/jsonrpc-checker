require('dotenv').config();
const { 
  Conflux, 
  Drip,
} = require('js-conflux-sdk');

const conflux = new Conflux({
  url: process.env.CFX_RPC,
  networkId: Number(process.env.CFX_NETWORK_ID),
});

const CRC20_META = require('../GLD.json');

const crc20Contract = conflux.Contract({
  abi: CRC20_META.abi,
  bytecode: CRC20_META.bytecode,
  address: process.env.CFX_CRC20_ADDRESS,
});

async function buildRawTx(account, tx) {
  tx.from = account.address;
  await conflux.cfx.populateTransaction(tx);
  return await account.signTransaction(tx);
}

async function cfxTransfer(fromAccount, to, value, nonce) {
  return await buildRawTx(fromAccount, {
    to,
    value: value || 0,
    nonce,
  });
}

async function crc20Deploy(fromAccount, nonce) {
  const amount = Drip.fromCFX(21000000);
  const data = crc20Contract.constructor.encodeData([amount]);
  return await buildRawTx(fromAccount, {
    to: null,
    data,
    nonce,
  });
}

async function crc20Transfer(fromAccount, to, value, nonce) {
  return await buildRawTx(fromAccount, {
    to: process.env.CFX_CRC20_ADDRESS,
    data: crc20Contract.transfer.encodeData([to, value || 0]),
    value: 0,
    nonce,
  });
}

module.exports = {
  buildRawTx,
  cfxTransfer,
  crc20Deploy,
  crc20Transfer,
};