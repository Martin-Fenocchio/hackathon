import { Injectable } from '@nestjs/common';
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  transfer as splTransfer,
  getMint,
  mintTo,
  getAccount,
} from '@solana/spl-token';

const TOKEN_MINT_ADDRESS = '5LaS3B9mNKrqj2JuFLFezyKFrfhg2uP3fg85z6dffyoS';
const MINT_AUTHORITY_BASE64 =
  'MDxSrQyB/TFsttPFF0SN7bgxqw+U7I6mZ6pw9M6z5HXuqr9DdoiSeH0Q4RFtdqWHsWufoG+FCbj6mWrNieKGxw==';

@Injectable()
export class SolanaService {
  private readonly connection: Connection;

  constructor() {
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  }

  async createWallet() {
    // 1. Generar la nueva wallet
    const keypair = Keypair.generate();
    const newWalletPublicKey = keypair.publicKey;

    // 2. Obtener mint y autoridad
    const mint = new PublicKey(TOKEN_MINT_ADDRESS);
    const mintAuthority = Keypair.fromSecretKey(Buffer.from(MINT_AUTHORITY_BASE64, 'base64'));

    // 3. Crear o encontrar la token account de la nueva wallet
    const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      mintAuthority,
      mint,
      newWalletPublicKey,
    );

    // 4. Obtener decimales del token
    const mintInfo = await getMint(this.connection, mint);
    const amount = BigInt(10000 * 10 ** mintInfo.decimals);

    // 5. Mint a la nueva cuenta
    await mintTo(
      this.connection,
      mintAuthority, // pagador
      mint,
      associatedTokenAccount.address,
      mintAuthority,
      amount,
    );

    return {
      publicKey: newWalletPublicKey.toBase58(),
      secretKey: Buffer.from(keypair.secretKey).toString('base64'),
      tokenAccount: associatedTokenAccount.address.toBase58(),
      message: `Minted 10,000 ${mint.toBase58()} tokens`,
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
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const fromKeypair = Keypair.fromSecretKey(Buffer.from(fromSecretKey, 'base64'));
    const toPubKey = new PublicKey(toPublicKey);
    const mint = new PublicKey(TOKEN_MINT_ADDRESS);

    // 1. Validar saldo en SOL
    const solBalance = await connection.getBalance(fromKeypair.publicKey);
    console.log('💰 Sender SOL balance:', solBalance / LAMPORTS_PER_SOL);

    if (solBalance < 0.002 * LAMPORTS_PER_SOL) {
      console.log('⚠️ Sender sin SOL. Pidiendo airdrop...');
      await connection.requestAirdrop(fromKeypair.publicKey, 2 * LAMPORTS_PER_SOL);
      await new Promise((res) => setTimeout(res, 3000)); // pequeña espera para que se confirme
    }

    // 2. Obtener info del token
    const mintInfo = await getMint(connection, mint);
    const amountInBaseUnits = BigInt(amount * 10 ** mintInfo.decimals);

    // 3. Obtener cuenta del emisor
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromKeypair,
      mint,
      fromKeypair.publicKey,
    );

    const fromAccountInfo = await getAccount(connection, fromTokenAccount.address);
    console.log('🏦 FROM token balance:', fromAccountInfo.amount.toString());

    // 4. Obtener o crear cuenta del receptor
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromKeypair, // payer de la creación
      mint,
      toPubKey,
    );

    // 6. Transferencia
    const signature = await splTransfer(
      connection,
      fromKeypair,
      fromTokenAccount.address,
      toTokenAccount.address,
      fromKeypair.publicKey,
      amountInBaseUnits,
    );

    console.log('✅ Transferencia confirmada. Signature:', signature);
    return { transferenceID: signature };
  }
}
