import { Injectable } from '@nestjs/common';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, transfer as splTransfer, getMint } from '@solana/spl-token';

@Injectable()
export class SolanaService {
  private readonly connection: Connection;

  constructor() {
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  }

  createWallet() {
    const keypair = Keypair.generate();
    return {
      publicKey: keypair.publicKey.toBase58(),
      secretKey: Buffer.from(keypair.secretKey).toString('base64'),
    };
  }

  async transferToken({
    fromSecretKey,
    toPublicKey,
    amount,
  }: {
    fromSecretKey: string;
    toPublicKey: string;
    amount: number;
  }) {
    const fromKeypair = Keypair.fromSecretKey(Buffer.from(fromSecretKey, 'base64'));
    const toPubKey = new PublicKey(toPublicKey);
    const mint = new PublicKey('5LaS3B9mNKrqj2JuFLFezyKFrfhg2uP3fg85z6dffyoS');

    // 1. Obtener info del token (para saber cuántos decimales tiene)
    const mintInfo = await getMint(this.connection, mint);
    const amountInBaseUnits = BigInt(amount * 10 ** mintInfo.decimals);

    // 2. Obtener (o crear) cuentas asociadas de token
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      fromKeypair,
      mint,
      fromKeypair.publicKey,
    );

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(this.connection, fromKeypair, mint, toPubKey);

    // 3. Transferencia
    const signature = await splTransfer(
      this.connection,
      fromKeypair,
      fromTokenAccount.address,
      toTokenAccount.address,
      fromKeypair.publicKey,
      amountInBaseUnits,
    );

    return { transferenceID: signature };
  }
}
