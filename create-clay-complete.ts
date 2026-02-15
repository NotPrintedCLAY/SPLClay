import {
  Connection,
  Keypair,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  setAuthority,
  AuthorityType,
} from "@solana/spl-token";

async function main() {
  console.log("Starting CLAY Token Creation...\n");

  // Connect to devnet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  console.log("Connected to Devnet.\n");

  // Generate payer keypair
  const payer = Keypair.generate();
  console.log("Payer: " + payer.publicKey.toString());

  // Request airdrop for fees
  console.log("Requesting airdrop (5 SOL)...");
  const airdropSig = await connection.requestAirdrop(
    payer.publicKey,
    5 * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(airdropSig);
  console.log("Airdrop received.\n");

  // Create mint
  const decimals = 6;
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey, // mint authority
    payer.publicKey, // freeze authority
    decimals
  );
  console.log("Mint created: " + mint.toString() + "\n");

  // Create associated token account for payer
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );
  console.log("Token account: " + tokenAccount.address.toString() + "\n");

  // Mint total supply
  const totalSupply = 100000000; // 100 million
  const mintAmount = BigInt(totalSupply) * 10n ** BigInt(decimals);

  await mintTo(
    connection,
    payer,
    mint,
    tokenAccount.address,
    payer,
    mintAmount
  );
  console.log("Minted " + totalSupply.toLocaleString() + " CLAY tokens.\n");

  // Revoke mint and freeze authority
  await setAuthority(connection, payer, mint, payer, AuthorityType.MintTokens, null);
  console.log("Mint authority revoked.");

  await setAuthority(connection, payer, mint, payer, AuthorityType.FreezeAccount, null);
  console.log("Freeze authority revoked.\n");

  // Final token info
  console.log("TOKEN CREATION SUCCESSFUL!\n");
  console.log("Token Info:");
  console.log("  Name: NotPrintedClay");
  console.log("  Symbol: CLAY");
  console.log("  Total Supply: " + totalSupply.toLocaleString() + " CLAY");
  console.log("  Decimals: " + decimals);
  console.log("  Token Account: " + tokenAccount.address.toString());
  console.log("  Mint Address: " + mint.toString());
  console.log("View on Devnet Explorer:");
  console.log("  https://explorer.solana.com/address/" + mint.toString() + "?cluster=devnet");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
