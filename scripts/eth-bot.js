const { ethers } = require("ethers");
require('dotenv').config();

const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC);

let key = '0x4179f59660cd78e7ecc9dd8a74572932840c1cfd234c9d8e64d50a9e11516d9d';
key = "0x2b45171969ced462642720adbc8d5d3f9b3813576f494deac44729f2482b47ef";
const signer = new ethers.Wallet(key , provider );

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