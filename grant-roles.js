const { ethers } = require('ethers');
const PropertyTitleABI = require('./src/abis/PropertyTitleTREX.json');

// Provider customizado para Besu
class LegacyProvider extends ethers.JsonRpcProvider {
  async getFeeData() {
    return new ethers.FeeData(ethers.toBigInt(1000), null, null);
  }
  async resolveName(name) {
    return null;
  }
}

async function grantRoles() {
  const rpcUrl = process.env.RPC_URL || 'http://besu-validator1-1:8545';
  const provider = new LegacyProvider(rpcUrl, {
    chainId: 1337,
    name: 'besu-private',
  });

  const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  const propertyContract = new ethers.Contract(
    process.env.PROPERTY_TITLE_ADDRESS,
    PropertyTitleABI,
    adminWallet
  );

  const FINANCIAL_ROLE = ethers.keccak256(ethers.toUtf8Bytes("FINANCIAL_ROLE"));
  const REGISTRY_OFFICE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRY_OFFICE_ROLE"));
  const MUNICIPALITY_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MUNICIPALITY_ROLE"));

  console.log('🔐 Concedendo roles ao admin wallet...');
  console.log(`   Admin: ${adminWallet.address}`);
  console.log(`   Contrato: ${propertyContract.target}`);
  console.log('');

  try {
    console.log('1️⃣ Concedendo FINANCIAL_ROLE...');
    const tx1 = await propertyContract.grantRole(FINANCIAL_ROLE, adminWallet.address, {
      type: 0,
      gasLimit: 100000,
      gasPrice: 1000
    });
    await tx1.wait();
    console.log(`   ✅ TX: ${tx1.hash}`);

    console.log('2️⃣ Concedendo REGISTRY_OFFICE_ROLE...');
    const tx2 = await propertyContract.grantRole(REGISTRY_OFFICE_ROLE, adminWallet.address, {
      type: 0,
      gasLimit: 100000,
      gasPrice: 1000
    });
    await tx2.wait();
    console.log(`   ✅ TX: ${tx2.hash}`);

    console.log('3️⃣ Concedendo MUNICIPALITY_ROLE...');
    const tx3 = await propertyContract.grantRole(MUNICIPALITY_ROLE, adminWallet.address, {
      type: 0,
      gasLimit: 100000,
      gasPrice: 1000
    });
    await tx3.wait();
    console.log(`   ✅ TX: ${tx3.hash}`);

    console.log('');
    console.log('🎉 Todas as roles concedidas com sucesso!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

grantRoles();

