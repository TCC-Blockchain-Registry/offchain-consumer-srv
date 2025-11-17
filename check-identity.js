const { ethers } = require('ethers');
const IdentityRegistryABI = require('./src/abis/IdentityRegistry.json');

class LegacyProvider extends ethers.JsonRpcProvider {
  async getFeeData() { return new ethers.FeeData(ethers.toBigInt(1000), null, null); }
  async resolveName(name) { return null; }
}

async function checkIdentity() {
  const provider = new LegacyProvider(process.env.RPC_URL, { chainId: 1337, name: 'besu-private' });
  const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  const identityRegistry = new ethers.Contract(process.env.IDENTITY_REGISTRY_ADDRESS, IdentityRegistryABI, adminWallet);

  const wallet1 = "0x3b59b80bef76afce7d0a0d19eeef73045a87816c";
  const wallet2 = "0x565524f400856766f11562832eB809d889491a01";
  
  console.log('🔍 Verificando identidades:');
  console.log('');
  
  console.log(`Wallet 1: ${wallet1}`);
  const isVerified1 = await identityRegistry.isVerified(wallet1);
  const isRegistered1 = await identityRegistry.contains(wallet1);
  console.log(`  isVerified: ${isVerified1}`);
  console.log(`  isRegistered: ${isRegistered1}`);
  
  console.log('');
  console.log(`Wallet 2 (admin): ${wallet2}`);
  const isVerified2 = await identityRegistry.isVerified(wallet2);
  const isRegistered2 = await identityRegistry.contains(wallet2);
  console.log(`  isVerified: ${isVerified2}`);
  console.log(`  isRegistered: ${isRegistered2}`);
}

checkIdentity().catch(console.error);
