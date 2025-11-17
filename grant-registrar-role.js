const { ethers } = require('ethers');
const RegistryMDComplianceABI = require('./src/abis/RegistryMDCompliance.json');

class LegacyProvider extends ethers.JsonRpcProvider {
  async getFeeData() {
    return new ethers.FeeData(ethers.toBigInt(1000), null, null);
  }
  async resolveName(name) {
    return null;
  }
}

async function grantRegistrarRole() {
  const provider = new LegacyProvider(process.env.RPC_URL, { chainId: 1337, name: 'besu-private' });
  const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  const complianceContract = new ethers.Contract(process.env.REGISTRY_MODULE_ADDRESS, RegistryMDComplianceABI, adminWallet);

  const REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRAR_ROLE"));

  console.log('🔐 Concedendo REGISTRAR_ROLE no RegistryMDCompliance...');
  console.log(`   Admin: ${adminWallet.address}`);
  console.log(`   Contrato: ${complianceContract.target}`);
  console.log(`   REGISTRAR_ROLE: ${REGISTRAR_ROLE}`);
  
  try {
    const tx = await complianceContract.grantRole(REGISTRAR_ROLE, adminWallet.address, {
      type: 0,
      gasLimit: 100000,
      gasPrice: 1000
    });
    await tx.wait();
    console.log(`   ✅ TX: ${tx.hash}`);
    console.log('\n🎉 REGISTRAR_ROLE concedido com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

grantRegistrarRole();

