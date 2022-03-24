require('dotenv').config();
const { Conflux } = require('js-conflux-sdk');
const rawTxBuilder = require('../src/utils/cfxRawTxGenerator');
const { 
  ZERO_ADDRESS, 
  CRC20_META,
} = require('../src/utils');
const fs = require('fs');
const path = require('path');

const conflux = new Conflux({
  url: process.env.CFX_RPC,
  networkId: Number(process.env.CFX_NETWORK_ID),
});

const account = conflux.wallet.addPrivateKey(process.env.TEST_KEY);

// load ERC20 contract
// const gld = conflux.Contract(CRC20_META);

const { program } = require('commander');
program.version('0.1.1');

program
  .option('-d, --debug', 'output extra debugging')

program
  .command('buildRawCfxTx')
  .argument('[to]', 'Transaction receiver', 'to')
  .argument('[value]', 'Transaction value', 'value')
  .action(async (to, value) => {
    const tx = await rawTxBuilder.cfxTransfer(account, to, value);
    console.log(tx.serialize());
  });

program
  .command('buildErc20TransferTx')
  .argument('[to]', 'Transaction receiver', 'to')
  .argument('[value]', 'Transaction value', 'value')
  .action(async (to, value) => {
    const tx = await rawTxBuilder.crc20Transfer(account, to, value);
    console.log(tx);
  });

program
  .command('genRawTxs')
  .action(async () => {
    // common cfx transfer
    const nonce = await conflux.cfx.getNextNonce(account.address);

    const tx = await rawTxBuilder.cfxTransfer(account, ZERO_ADDRESS, 100, nonce);
    // deploy
    const tx2 = await rawTxBuilder.crc20Deploy(account, nonce + BigInt(1));
    // crc20 transfer
    const tx3 = await rawTxBuilder.crc20Transfer(account, account.address, 100, nonce + BigInt(2));

    let txs = {
      cfxTransfer: {
        hash: tx.hash,
        raw: tx.serialize(),
      },
      erc20Transfer: {
        hash: tx3.hash,
        raw: tx3.serialize(),
      },
      erc20Deploy: {
        hash: tx2.hash,
        raw: tx2.serialize(),
      }
    };
    fs.writeFileSync(path.join(__dirname, '../build/cfxtxs.json'), JSON.stringify(txs, null, 2));
    console.log('Generate Success!');
  });

program
  .command('sendTxs')
  .action(async () => {
    const txsFilePath = path.join(__dirname, '../build/cfxtxs.json');
    const txs = require(txsFilePath);
    const receipt1 = await conflux.cfx.sendRawTransaction(txs.cfxTransfer.raw).executed();
    txs.cfxTransferReceipt = receipt1;
    console.log('tx1: ', receipt1.transactionHash);
    const receipt2 = await conflux.cfx.sendRawTransaction(txs.erc20Deploy.raw).executed();
    txs.erc20DeployReceipt = receipt2;
    console.log('tx2: ', receipt2.transactionHash);
    const receipt3 = await conflux.cfx.sendRawTransaction(txs.erc20Transfer.raw).executed();
    txs.erc20TransferReceipt = receipt3;
    console.log('tx3: ', receipt3.transactionHash);
    fs.writeFileSync(txsFilePath, JSON.stringify(txs, null, 2));
  });

program.parse(process.argv);

const options = program.opts();
if (options.debug) console.log(options);