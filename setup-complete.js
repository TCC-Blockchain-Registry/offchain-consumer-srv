const { ethers } = require('ethers');
const PropertyTitleABI = require('./src/abis/PropertyTitleTREX.json');
const RegistryMDComplianceABI = require('./src/abis/RegistryMDCompliance.json');
const IdentityRegistryABI = require('./src/abis/IdentityRegistry.json');

class LegacyProvider extends ethers.JsonRpcProvider {
  async getFeeData() {
    return new ethers.FeeData(ethers.toBigInt(1000), null, null);
  }
  async resolveName(name) {
    return null;
  }
}

async function setupComplete() {
  const provider = new LegacyProvider(process.env.RPC_URL, { chainId: 1337, name: 'besu-private' });
  const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

  console.log('🔧 SETUP COMPLETO DO SISTEMA');
  console.log('='.repeat(50));
  console.log(`Admin: ${adminWallet.address}`);
  console.log('');

  try {
    // 1. PropertyTitleTREX
    const propertyContract = new ethers.Contract(
      process.env.PROPERTY_TITLE_ADDRESS,
      PropertyTitleABI,
      adminWallet
    );

    const AGENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AGENT"));
    const FINANCIAL_ROLE = ethers.keccak256(ethers.toUtf8Bytes("FINANCIAL_ROLE"));
    const REGISTRY_OFFICE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRY_OFFICE_ROLE"));
    const MUNICIPALITY_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MUNICIPALITY_ROLE"));

    console.log('1️⃣ PropertyTitleTREX Roles:');
    console.log(`   Contrato: ${propertyContract.target}`);
    
    const tx1 = await propertyContract.grantRole(AGENT_ROLE, adminWallet.address, { type: 0, gasLimit: 100000, gasPrice: 1000 });
    await tx1.wait();
    console.log(`   ✅ AGENT_ROLE: ${tx1.hash}`);

    const tx2 = await propertyContract.grantRole(FINANCIAL_ROLE, adminWallet.address, { type: 0, gasLimit: 100000, gasPrice: 1000 });
    await tx2.wait();
    console.log(`   ✅ FINANCIAL_ROLE: ${tx2.hash}`);

    const tx3 = await propertyContract.grantRole(REGISTRY_OFFICE_ROLE, adminWallet.address, { type: 0, gasLimit: 100000, gasPrice: 1000 });
    await tx3.wait();
    console.log(`   ✅ REGISTRY_OFFICE_ROLE: ${tx3.hash}`);

    const tx4 = await propertyContract.grantRole(MUNICIPALITY_ROLE, adminWallet.address, { type: 0, gasLimit: 100000, gasPrice: 1000 });
    await tx4.wait();
    console.log(`   ✅ MUNICIPALITY_ROLE: ${tx4.hash}`);

    // 2. RegistryMDCompliance
    const complianceContract = new ethers.Contract(
      process.env.REGISTRY_MODULE_ADDRESS,
      RegistryMDComplianceABI,
      adminWallet
    );

    const REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRAR_ROLE"));

    console.log('\n2️⃣ RegistryMDCompliance Role:');
    console.log(`   Contrato: ${complianceContract.target}`);
    
    const tx5 = await complianceContract.grantRole(REGISTRAR_ROLE, adminWallet.address, { type: 0, gasLimit: 100000, gasPrice: 1000 });
    await tx5.wait();
    console.log(`   ✅ REGISTRAR_ROLE: ${tx5.hash}`);

    // 3. IdentityRegistry - Add Agent
    const identityContract = new ethers.Contract(
      process.env.IDENTITY_REGISTRY_ADDRESS,
      IdentityRegistryABI,
      adminWallet
    );

    console.log('\n3️⃣ IdentityRegistry Agent:');
    console.log(`   Contrato: ${identityContract.target}`);
    
    const tx6 = await identityContract.addAgent(adminWallet.address, { type: 0, gasLimit: 100000, gasPrice: 1000 });
    await tx6.wait();
    console.log(`   ✅ Agent adicionado: ${tx6.hash}`);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 SETUP COMPLETO COM SUCESSO!');
    console.log('');
    console.log('Agora você pode:');
    console.log('  - Registrar propriedades via V1 (direto)');
    console.log('  - Usar sistema V2 (com aprovações)');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.data) {
      console.error('Data:', error.data);
    }
    process.exit(1);
  }
}

setupComplete();

