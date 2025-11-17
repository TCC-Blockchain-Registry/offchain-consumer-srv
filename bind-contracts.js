const { ethers } = require('ethers');
const PropertyTitleABI = require('./src/abis/PropertyTitleTREX.json');
const ModularComplianceJSON = require('./src/abis/ModularCompliance.json');
const RegistryMDComplianceABI = require('./src/abis/RegistryMDCompliance.json');

// Foundry ABI format
const ModularComplianceABI = ModularComplianceJSON.abi || ModularComplianceJSON;

class LegacyProvider extends ethers.JsonRpcProvider {
  async getFeeData() {
    return new ethers.FeeData(ethers.toBigInt(1000), null, null);
  }
  async resolveName(name) {
    return null;
  }
}

async function bindContracts() {
  const provider = new LegacyProvider(process.env.RPC_URL, { chainId: 1337, name: 'besu-private' });
  const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

  console.log('🔗 VINCULANDO CONTRATOS MANUALMENTE');
  console.log('='.repeat(60));
  console.log(`Admin: ${adminWallet.address}`);
  console.log('');

  try {
    // Contratos
    const propertyTitle = new ethers.Contract(
      process.env.PROPERTY_TITLE_ADDRESS,
      PropertyTitleABI,
      adminWallet
    );

    const modularCompliance = new ethers.Contract(
      process.env.MODULAR_COMPLIANCE_ADDRESS,
      ModularComplianceABI,
      adminWallet
    );

    const registryMDCompliance = new ethers.Contract(
      process.env.REGISTRY_MODULE_ADDRESS,
      RegistryMDComplianceABI,
      adminWallet
    );

    console.log('📋 Endereços dos Contratos:');
    console.log(`   PropertyTitle: ${propertyTitle.target}`);
    console.log(`   ModularCompliance: ${modularCompliance.target}`);
    console.log(`   RegistryMDCompliance: ${registryMDCompliance.target}`);
    console.log('');

    // 1. Verificar se já está vinculado
    console.log('1️⃣ Verificando vínculos atuais...');
    try {
      const tokenBound = await modularCompliance.getTokenBound();
      console.log(`   Token vinculado no ModularCompliance: ${tokenBound}`);
      
      if (tokenBound === ethers.ZeroAddress) {
        console.log('   ⚠️  Nenhum token vinculado!');
      } else if (tokenBound.toLowerCase() === propertyTitle.target.toLowerCase()) {
        console.log('   ✅ PropertyTitle já está vinculado!');
        console.log('');
        console.log('🎉 Contratos já estão vinculados corretamente!');
        process.exit(0);
      }
    } catch (error) {
      console.log(`   ⚠️  Erro ao verificar: ${error.message}`);
    }
    console.log('');

    // 2. Vincular PropertyTitle ao ModularCompliance
    console.log('2️⃣ Vinculando PropertyTitle ao ModularCompliance...');
    try {
      const tx1 = await modularCompliance.bindToken(
        propertyTitle.target,
        { type: 0, gasLimit: 150000, gasPrice: 1000 }
      );
      await tx1.wait();
      console.log(`   ✅ Vinculado! TX: ${tx1.hash}`);
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    console.log('');

    // 3. Adicionar RegistryMDCompliance module ao ModularCompliance
    console.log('3️⃣ Adicionando RegistryMDCompliance como módulo...');
    try {
      const tx2 = await modularCompliance.addModule(
        registryMDCompliance.target,
        { type: 0, gasLimit: 150000, gasPrice: 1000 }
      );
      await tx2.wait();
      console.log(`   ✅ Módulo adicionado! TX: ${tx2.hash}`);
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    console.log('');

    // 4. Vincular compliance no RegistryMDCompliance
    console.log('4️⃣ Vinculando ModularCompliance ao RegistryMDCompliance...');
    try {
      const tx3 = await registryMDCompliance.bindCompliance(
        modularCompliance.target,
        { type: 0, gasLimit: 150000, gasPrice: 1000 }
      );
      await tx3.wait();
      console.log(`   ✅ Compliance vinculado! TX: ${tx3.hash}`);
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    console.log('');

    console.log('='.repeat(60));
    console.log('🎉 PROCESSO DE VINCULAÇÃO CONCLUÍDO!');
    console.log('');
    console.log('Verificando vínculos finais...');
    
    const finalTokenBound = await modularCompliance.getTokenBound();
    console.log(`   Token vinculado: ${finalTokenBound}`);
    
    const isModuleAdded = await modularCompliance.isModuleBound(registryMDCompliance.target);
    console.log(`   RegistryMD como módulo: ${isModuleAdded}`);
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erro geral:', error.message);
    process.exit(1);
  }
}

bindContracts();
