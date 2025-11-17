const { ethers } = require('ethers');
const PropertyTitleABI = require('./src/abis/PropertyTitleTREX.json');

class LegacyProvider extends ethers.JsonRpcProvider {
  async getFeeData() {
    return new ethers.FeeData(ethers.toBigInt(1000), null, null);
  }
  async resolveName(name) {
    return null;
  }
}

async function grantAgentRole() {
  const provider = new LegacyProvider(process.env.RPC_URL, { chainId: 1337, name: 'besu-private' });
  const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  const propertyContract = new ethers.Contract(process.env.PROPERTY_TITLE_ADDRESS, PropertyTitleABI, adminWallet);

  const AGENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AGENT"));

  console.log('🔐 Concedendo AGENT_ROLE para permitir registros V1...');
  console.log(`   Admin: ${adminWallet.address}`);
  console.log(`   Contrato: ${propertyContract.target}`);
  console.log(`   AGENT_ROLE: ${AGENT_ROLE}`);
  
  try {
    const tx = await propertyContract.grantRole(AGENT_ROLE, adminWallet.address, {
      type: 0,
      gasLimit: 100000,
      gasPrice: 1000
    });
    await tx.wait();
    console.log(`   ✅ TX: ${tx.hash}`);
    console.log('\n🎉 AGENT_ROLE concedido com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

grantAgentRole();
