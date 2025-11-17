const { ethers } = require('ethers');
const PropertyTitleABI = require('./src/abis/PropertyTitleTREX.json');

class LegacyProvider extends ethers.JsonRpcProvider {
  async getFeeData() { return new ethers.FeeData(ethers.toBigInt(1000), null, null); }
  async resolveName(name) { return null; }
}

async function checkContracts() {
  const provider = new LegacyProvider('http://127.0.0.1:8545', { chainId: 1337, name: 'besu-private' });
  const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  const propertyContract = new ethers.Contract(process.env.PROPERTY_TITLE_ADDRESS, PropertyTitleABI, adminWallet);

  console.log('🔍 Verificando endereços dos contratos:');
  console.log('');
  
  const identityRegistryFromProperty = await propertyContract.identityRegistry();
  console.log(`PropertyTitle aponta para IdentityRegistry: ${identityRegistryFromProperty}`);
  console.log(`Nós estamos usando IdentityRegistry:        ${process.env.IDENTITY_REGISTRY_ADDRESS}`);
  console.log('');
  
  if (identityRegistryFromProperty.toLowerCase() !== process.env.IDENTITY_REGISTRY_ADDRESS.toLowerCase()) {
    console.log('❌ OS CONTRATOS SÃO DIFERENTES!');
  } else {
    console.log('✅ Contratos correspondem');
  }
}

checkContracts().catch(console.error);
