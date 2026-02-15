import {
  Connection,
  Keypair,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  setAuthority,
  AuthorityType,
} from "@solana/spl-token";
import { Metaplex, bundlrStorage, keypairIdentity } from "@metaplex-foundation/js";

async function main() {
  console.log("🚀 Starting NotPrintedClay Token Creation...\n");

  // ==================== CONFIGURATION ====================
  // 🔧 GANTI URL LOGO INI DENGAN URL DARI NFT.STORAGE ANDA!
  const LOGO_URL = "https://nft.storage/ipfs/YOUR_IPFS_HASH_HERE";
  
  // Jika Anda belum upload, gunakan placeholder ini dulu:
  // const LOGO_URL = "https://via.placeholder.com/400";

  // ==================== SETUP CONNECTION ====================
  console.log("📡 Connecting to Solana Devnet...");
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  console.log("✅ Connected!\n");

  // ==================== GENERATE KEYPAIRS ====================
  console.log("🔐 Generating keypairs...");
  const payer = Keypair.generate();
  const mintAuthority = Keypair.generate();
  const freezeAuthority = Keypair.generate();

  console.log("  Payer:            " + payer.publicKey.toString());
  console.log("  Mint Authority:   " + mintAuthority.publicKey.toString());
  console.log("  Freeze Authority: " + freezeAuthority.publicKey.toString());
  console.log("✅ Keypairs generated!\n");

  // ==================== REQUEST AIRDROP ====================
  console.log("💰 Requesting airdrop (5 SOL for fees)...");
  const airdropSignature = await connection.requestAirdrop(
    payer.publicKey,
    5 * 10 ** 9 // 5 SOL
  );

  await connection.confirmTransaction(airdropSignature);
  console.log("✅ Airdrop received!\n");

  // ==================== CREATE MINT ====================
  console.log("⚙️  Creating token mint...");
  const mint = await createMint(
    connection,
    payer,
    mintAuthority.publicKey,
    freezeAuthority.publicKey,
    6 // 6 decimal places
  );

  console.log("✅ Mint created!");
  console.log("  📍 Mint Address: " + mint.toString() + "\n");

  // ==================== CREATE TOKEN ACCOUNT ====================
  console.log("⚙️  Creating associated token account...");
  const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );

  console.log("✅ Token account created!");
  console.log("  📍 Account Address: " + associatedTokenAccount.address.toString() + "\n");

  // ==================== MINT TOKENS ====================
  console.log("⚙️  Minting 100,000,000 CLAY tokens...");
  const totalSupply = 100_000_000;
  const decimals = 6;
  const mintAmount = totalSupply * Math.pow(10, decimals);

  await mintTo(
    connection,
    payer,
    mint,
    associatedTokenAccount.address,
    mintAuthority,
    mintAmount
  );

  console.log("✅ Tokens minted!");
  console.log("  📊 Total Supply: " + totalSupply.toLocaleString() + " CLAY\n");

  // ==================== SETUP METAPLEX ====================
  console.log("📦 Setting up Metaplex for metadata...");
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(payer))
    .use(bundlrStorage());

  console.log("✅ Metaplex ready!\n");

  // ==================== CREATE METADATA ====================
  console.log("⚙️  Creating token metadata...");
  console.log("  Logo URL: " + LOGO_URL);

  const metadataUri = await metaplex.nfts().uploadMetadata({
    name: "NotPrintedClay",
    symbol: "CLAY",
    description: "A fixed supply token with immutable properties on Solana blockchain",
    image: LOGO_URL,
    attributes: [
      {
        trait_type: "Blockchain",
        value: "Solana",
      },
      {
        trait_type: "Total Supply",
        value: "100,000,000",
      },
      {
        trait_type: "Decimals",
        value: "6",
      },
      {
        trait_type: "Mint Authority",
        value: "Revoked",
      },
      {
        trait_type: "Freeze Authority",
        value: "Revoked",
      },
    ],
  });

  console.log("✅ Metadata uploaded!");
  console.log("  🔗 Metadata URI: " + metadataUri + "\n");

  // ==================== CREATE NFT METADATA ACCOUNT ====================
  console.log("⚙️  Creating metadata account on chain...");
  const nft = await metaplex.nfts().create({
    mint: mint,
    name: "NotPrintedClay",
    symbol: "CLAY",
    uri: metadataUri,
    sellerFeeBasisPoints: 0, // No royalties
  });

  console.log("✅ Metadata account created!");
  console.log("  📍 Metadata Address: " + nft.address.toString() + "\n");

  // ==================== REVOKE MINT AUTHORITY ====================
  console.log("🔒 Revoking Mint Authority...");
  await setAuthority(
    connection,
    payer,
    mint,
    mintAuthority,
    AuthorityType.MintTokens,
    null // null = revoke
  );

  console.log("✅ Mint Authority REVOKED!");
  console.log("   ❌ No more tokens can be minted!\n");

  // ==================== REVOKE FREEZE AUTHORITY ====================
  console.log("🔒 Revoking Freeze Authority...");
  await setAuthority(
    connection,
    payer,
    mint,
    freezeAuthority,
    AuthorityType.FreezeAccount,
    null // null = revoke
  );

  console.log("✅ Freeze Authority REVOKED!");
  console.log("   ❌ Tokens cannot be frozen!\n");

  // ==================== FINAL SUMMARY ====================
  console.log("=" + "=".repeat(75));
  console.log("🎉 TOKEN CREATION SUCCESSFUL!");
  console.log("=" + "=".repeat(75));
  console.log("");
  console.log("📋 TOKEN INFORMATION:");
  console.log("");
  console.log("  Token Name:         NotPrintedClay");
  console.log("  Symbol:             CLAY");
  console.log("  Logo:               ✅ Added");
  console.log("");
  console.log("📍 BLOCKCHAIN ADDRESSES:");
  console.log("  Mint Address:       " + mint.toString());
  console.log("  Token Account:      " + associatedTokenAccount.address.toString());
  console.log("  Metadata Account:   " + nft.address.toString());
  console.log("");
  console.log("📊 TOKEN PROPERTIES:");
  console.log("  Total Supply:       100,000,000 CLAY");
  console.log("  Decimals:           6");
  console.log("  Your Balance:       100,000,000 CLAY");
  console.log("");
  console.log("🔐 SECURITY STATUS:");
  console.log("  Mint Authority:     ❌ REVOKED (Supply is FIXED)");
  console.log("  Freeze Authority:   ❌ REVOKED (Cannot be frozen)");
  console.log("");
  console.log("🔗 VIEW ON BLOCKCHAIN:");
  console.log("  Solana Explorer:");
  console.log("  https://explorer.solana.com/address/" + mint.toString() + "?cluster=devnet");
  console.log("");
  console.log("💡 NEXT STEPS:");
  console.log("  1. Verify token on Solana Explorer (link above)");
  console.log("  2. Logo akan muncul dalam beberapa menit");
  console.log("  3. Share Mint Address dengan orang lain untuk import token");
  console.log("  4. Untuk mainnet, ubah 'devnet' menjadi 'mainnet-beta'");
  console.log("");
}

main().catch((error) => {
  console.error("❌ Error occurred:");
  console.error(error);
  process.exit(1);
});
