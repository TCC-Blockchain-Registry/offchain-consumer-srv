const { ethers } = require('ethers');
const IdentityRegistryABI = require('./src/abis/IdentityRegistry.json');

class LegacyProvider extends ethers.JsonRpcProvider {
  async getFeeData() { return new ethers.FeeData(ethers.toBigInt(1000), null, null); }
  async resolveName(name) { return null; }
}

async function registerIdentity() {
  const provider = new LegacyProvider(process.env.RPC_URL, { chainId: 1337, name: 'besu-private' });
  const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  const identityRegistry = new ethers.Contract(process.env.IDENTITY_REGISTRY_ADDRESS, IdentityRegistryABI, adminWallet);

  const walletToRegister = process.env.WALLET_TO_REGISTER;
  
  console.log(`🔍 Verificando identidade de ${walletToRegister}...`);
  const isVerified = await identityRegistry.isVerified(walletToRegister);
  
  if (isVerified) {
    console.log('   ✅ Identidade já registrada!');
    return;
  }
  
  console.log('   ⚠️  Não registrada. Registrando...');
  
  const tx = await identityRegistry.registerIdentity(
    walletToRegister,
    ethers.ZeroAddress,
    76, // Brasil
    { type: 0, gasLimit: 300000, gasPrice: 1000 }
  );
  await tx.wait();
  console.log(`   ✅ Identidade registrada! TX: ${tx.hash}`);
}

registerIdentity().catch(console.error);
