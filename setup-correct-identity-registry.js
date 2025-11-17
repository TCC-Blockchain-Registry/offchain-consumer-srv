const { ethers } = require('ethers');
const IdentityRegistryABI = require('./src/abis/IdentityRegistry.json');

class LegacyProvider extends ethers.JsonRpcProvider {
  async getFeeData() { return new ethers.FeeData(ethers.toBigInt(1000), null, null); }
  async resolveName(name) { return null; }
}

async function setup() {
  const provider = new LegacyProvider(process.env.RPC_URL, { chainId: 1337, name: 'besu-private' });
  const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  const identityRegistry = new ethers.Contract(process.env.IDENTITY_REGISTRY_ADDRESS, IdentityRegistryABI, adminWallet);

  console.log('🔧 Setup do IdentityRegistry Correto');
  console.log(`   Contrato: ${process.env.IDENTITY_REGISTRY_ADDRESS}`);
  console.log(`   Admin: ${adminWallet.address}`);
  console.log('');
  
  // 1. Conceder permissão de AGENT pro admin
  console.log('1️⃣ Concedendo permissão de AGENT...');
  try {
    const isAgent = await identityRegistry.isAgent(adminWallet.address);
    if (isAgent) {
      console.log('   ✅ Admin já é Agent!');
    } else {
      const tx1 = await identityRegistry.addAgent(adminWallet.address, { type: 0, gasLimit: 100000, gasPrice: 1000 });
      await tx1.wait();
      console.log(`   ✅ Agent adicionado! TX: ${tx1.hash}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Erro: ${error.message}`);
  }
  
  // 2. Registrar identidade do usuário
  const userWallet = process.env.USER_WALLET;
  console.log(`\n2️⃣ Registrando identidade do usuário: ${userWallet}`);
  
  const isVerified = await identityRegistry.isVerified(userWallet);
  if (isVerified) {
    console.log('   ✅ Já verificado!');
  } else {
    // Usar identity contract do admin
    const adminIdentity = await identityRegistry.identity(adminWallet.address);
    console.log(`   Usando identity contract: ${adminIdentity}`);
    
    const tx2 = await identityRegistry.registerIdentity(userWallet, adminIdentity, 76, { type: 0, gasLimit: 300000, gasPrice: 1000 });
    await tx2.wait();
    console.log(`   ✅ Registrado! TX: ${tx2.hash}`);
  }
  
  console.log('\n✅ Setup completo!');
}

setup().catch(console.error);
