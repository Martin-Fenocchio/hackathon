import { Injectable } from '@nestjs/common';
import { JsonRpcProvider, Wallet, parseEther } from 'ethers';

@Injectable()
export class PolygonService {
  private readonly provider: JsonRpcProvider;

  constructor() {
    this.provider = new JsonRpcProvider('https://rpc-mumbai.maticvigil.com');
  }

  createWallet() {
    const wallet = Wallet.createRandom();

    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase,
    };
  }

  async sendMatic(fromPrivateKey: string, toAddress: string, amountInMatic: string) {
    const wallet = new Wallet(fromPrivateKey, this.provider);

    const tx = {
      to: toAddress,
      value: parseEther(amountInMatic),
    };

    const transactionResponse = await wallet.sendTransaction(tx);
    const receipt = await transactionResponse.wait();

    return {
      txHash: receipt?.hash,
      status: receipt?.status,
      to: receipt?.to,
      from: receipt?.from,
      amount: amountInMatic,
    };
  }
}
