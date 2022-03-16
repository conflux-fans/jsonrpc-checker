const { ethers } = require("ethers");
require('dotenv').config();

const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC);

let key = process.env.PRIVATE_KEY;
const signer = new ethers.Wallet(key , provider);

async function main() {
  // balance = await provider.getBalance(signer.getAddress());
  // console.log(balance);
  // { BigNumber: "2337132817842795605" }

  for(let i = 0; i < 2000; i++) {
    const tx = await signer.sendTransaction({
      to: signer.getAddress(),
      value: ethers.utils.parseEther("0.001")
    });
    console.log(tx.hash, tx.nonce);
  }
}

main().catch(console.log);