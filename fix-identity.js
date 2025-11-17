const { ethers } = require('ethers');
const IdentityRegistryABI = require('./src/abis/IdentityRegistry.json');

class LegacyProvider extends ethers.JsonRpcProvider {
  async getFeeData() { return new ethers.FeeData(ethers.toBigInt(1000), null, null); }
  async resolveName(name) { return null; }
}

async function fixIdentity() {
  const provider = new LegacyProvider(process.env.RPC_URL, { chainId: 1337, name: 'besu-private' });
  const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  const identityRegistry = new ethers.Contract(process.env.IDENTITY_REGISTRY_ADDRESS, IdentityRegistryABI, adminWallet);

  const walletToFix = process.env.WALLET_TO_FIX;
  
  console.log(`🔧 Corrigindo identidade de ${walletToFix}...`);
  
  // 1. Remover identidade existente
  console.log('1. Removendo identidade existente...');
  try {
    const tx1 = await identityRegistry.deleteIdentity(walletToFix, {
      type: 0, gasLimit: 200000, gasPrice: 1000
    });
    await tx1.wait();
    console.log(`   ✅ Removida! TX: ${tx1.hash}`);
  } catch (error) {
    console.log(`   ⚠️  Erro ao remover: ${error.message}`);
  }
  
  // 2. Re-registrar com identity contract válido (usar o do admin)
  console.log('2. Re-registrando identidade...');
  const adminIdentity = await identityRegistry.identity(process.env.ADMIN_WALLET);
  console.log(`   Usando identity contract do admin: ${adminIdentity}`);
  
  const tx2 = await identityRegistry.registerIdentity(
    walletToFix,
    adminIdentity, // Usar mesmo identity contract do admin
    76, // Brasil
    { type: 0, gasLimit: 300000, gasPrice: 1000 }
  );
  await tx2.wait();
  console.log(`   ✅ Re-registrado! TX: ${tx2.hash}`);
  
  // 3. Verificar
  const isVerified = await identityRegistry.isVerified(walletToFix);
  console.log(`\n✅ Verificação final: isVerified = ${isVerified}`);
}

fixIdentity().catch(console.error);
