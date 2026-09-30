async function getClient() {
  const { SuiClient, getFullnodeUrl } = await import("@mysten/sui/client");
  const network = (process.env.SUI_NETWORK || "testnet") as "testnet" | "mainnet";
  return new SuiClient({ url: getFullnodeUrl(network) });
}

function getPackageId(): string {
  return process.env.SUI_PACKAGE_ID!;
}

async function getAdminKeypair() {
  const { Ed25519Keypair } = await import("@mysten/sui/keypairs/ed25519");
  const { fromB64 } = await import("@mysten/sui/utils");
  const key = process.env.SUI_ADMIN_PRIVATE_KEY!;
  return Ed25519Keypair.fromSecretKey(fromB64(key).slice(1));
}

export async function registerStudentOnChain(
  studentAddress: string,
): Promise<{ digest: string; entryObjectId: string }> {
  const { Transaction } = await import("@mysten/sui/transactions");
  const client = await getClient();
  const keypair = await getAdminKeypair();
  const packageId = getPackageId();
  const capId = process.env.SUI_ADMIN_CAP_OBJECT_ID!;

  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::club_registry::register_entry`,
    arguments: [tx.object(capId), tx.pure.address(studentAddress)],
  });

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: { showEffects: true },
  });

  const entryObjectId = result.effects?.created?.[1]?.reference?.objectId || "";
  return { digest: result.digest, entryObjectId };
}

export async function awardPointsOnChain(
  studentAddress: string,
  entryObjectId: string,
  category: number,
  amount: number,
): Promise<string> {
  const { Transaction } = await import("@mysten/sui/transactions");
  const client = await getClient();
  const keypair = await getAdminKeypair();
  const packageId = getPackageId();
  const capId = process.env.SUI_ADMIN_CAP_OBJECT_ID!;

  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::club_registry::award_points`,
    arguments: [
      tx.object(capId),
      tx.object(entryObjectId),
      tx.pure.u8(category),
      tx.pure.u64(amount),
    ],
  });

  const result = await client.signAndExecuteTransaction({ transaction: tx, signer: keypair });
  return result.digest;
}

export async function mintBadgeOnChain(
  studentAddress: string,
  badgeType: number,
  name: string,
  description: string,
): Promise<string> {
  const { Transaction } = await import("@mysten/sui/transactions");
  const client = await getClient();
  const keypair = await getAdminKeypair();
  const packageId = getPackageId();
  const capId = process.env.SUI_ADMIN_CAP_OBJECT_ID!;

  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::club_registry::mint_badge`,
    arguments: [
      tx.object(capId),
      tx.pure.address(studentAddress),
      tx.pure.u8(badgeType),
      tx.pure.string(name),
      tx.pure.string(description),
    ],
  });

  const result = await client.signAndExecuteTransaction({ transaction: tx, signer: keypair });
  return result.digest;
}

export async function issueCertificateOnChain(
  studentAddress: string,
  tier: number,
  track: string,
  cohortYear: number,
  portfolioUrl: string,
): Promise<string> {
  const { Transaction } = await import("@mysten/sui/transactions");
  const client = await getClient();
  const keypair = await getAdminKeypair();
  const packageId = getPackageId();
  const capId = process.env.SUI_ADMIN_CAP_OBJECT_ID!;

  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::club_registry::issue_certificate`,
    arguments: [
      tx.object(capId),
      tx.pure.address(studentAddress),
      tx.pure.u8(tier),
      tx.pure.string(track),
      tx.pure.u16(cohortYear),
      tx.pure.string(portfolioUrl),
    ],
  });

  const result = await client.signAndExecuteTransaction({ transaction: tx, signer: keypair });
  return result.digest;
}
