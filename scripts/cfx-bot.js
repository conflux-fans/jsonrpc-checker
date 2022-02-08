require('dotenv').config();
const { Conflux } = require('js-conflux-sdk');

const conflux = new Conflux({
  url: process.env.CFX_RPC,
  networkId: 8888,
});

const account = conflux.wallet.addPrivateKey(process.env.PRIVATE_KEY);

async function main() {
  await fastSend();
}

main().catch(console.log);

async function fastSend() {
  for (let i = 0; i < 2000; i++) {
    const tx = await conflux.cfx.sendTransaction({
      from: account.address,
      to: account.address,
      value: 1,
    });
    console.log(tx);
  }
}