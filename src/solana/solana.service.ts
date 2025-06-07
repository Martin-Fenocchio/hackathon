/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

@Injectable()
export class SolanaService {
  private readonly connection: Connection;

  constructor() {
    this.connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed',
    );
  }

  createWallet() {
    const keypair = Keypair.generate();
    return {
      publicKey: keypair.publicKey.toBase58(),
      secretKey: Buffer.from(keypair.secretKey).toString('base64'),
    };
  }

  async transferSol({
    fromSecretKey,
    toPublicKey,
    amountSol,
  }: {
    fromSecretKey: string;
    toPublicKey: string;
    amountSol: number;
  }) {
    const fromKeypair = Keypair.fromSecretKey(
      Buffer.from(fromSecretKey, 'base64'),
    );
    const toPubKey = new PublicKey(toPublicKey);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPubKey,
        lamports: amountSol * LAMPORTS_PER_SOL,
      }),
    );
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [fromKeypair],
    );
    return { signature, transaction };
  }
}
