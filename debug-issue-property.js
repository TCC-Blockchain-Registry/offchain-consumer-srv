#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

class LegacyProvider extends ethers.JsonRpcProvider {
  async getBlock(blockHashOrBlockTag, prefetchTxs) {
    const block = await super.getBlock(blockHashOrBlockTag, prefetchTxs);
    if (block) block.baseFeePerGas = null;
    return block;
  }
  async getFeeData() {
    return new ethers.FeeData(BigInt(1000), null, null);
  }
  async resolveName(name) {
    return null;
  }
}

async function debug() {
  try {
    console.log('\n🔍 Debug: Verificando condições para issueProperty\n');

    const provider = new LegacyProvider(process.env.RPC_URL, {
      chainId: Number(process.env.CHAIN_ID) || 1337,
      name: 'besu-private',
    });

    const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    console.log('👤 Admin:', adminWallet.address);

    const PropertyTitleABI = require('./src/abis/PropertyTitleTREX.json');
    const RegistryModuleABI = require('./src/abis/RegistryMDCompliance.json');
    const IdentityRegistryABI = require('./src/abis/IdentityRegistry.json');
    const ComplianceABI = require('./src/abis/PropertyTitleTREX.json'); // usa ABIs do Token para ModularCompliance
    
    const propertyTitle = new ethers.Contract(process.env.PROPERTY_TITLE_ADDRESS, PropertyTitleABI, provider);
    const registryModule = new ethers.Contract(process.env.REGISTRY_MODULE_ADDRESS, RegistryModuleABI, provider);
    const identityRegistry = new ethers.Contract(process.env.IDENTITY_REGISTRY_ADDRESS, IdentityRegistryABI, provider);

    const matricula = 888999;
    const owner = adminWallet.address;

    console.log('\n📋 Verificando condições do issueProperty:');
    
    // 1. isAgent
    const isAgent = await propertyTitle.isAgent(adminWallet.address);
    console.log(`   1. isAgent(${adminWallet.address}): ${isAgent ? '✅' : '❌'} ${isAgent}`);

    // 2. isVerified
    const isVerified = await identityRegistry.isVerified(owner);
    console.log(`   2. isVerified(${owner}): ${isVerified ? '✅' : '❌'} ${isVerified}`);

    // 3. propertyExists
    const exists = await propertyTitle.propertyExists(matricula);
    console.log(`   3. propertyExists(${matricula}): ${exists ? '❌ JÁ EXISTE' : '✅'} ${exists}`);

    // 4. matricula > 0
    console.log(`   4. matricula > 0: ✅ ${matricula}`);

    console.log('\n📋 Verificando condições do mint (chamado internamente):');
    
    // compliance.canTransfer (mint é uma transferência de address(0) para owner)
    try {
      const compliance = await propertyTitle.compliance();
      console.log(`   Compliance address: ${compliance}`);
      
      // Verificar se property está registrada no compliance
      try {
        const property = await registryModule.getProperty(matricula);
        console.log('   5. Property registrada no compliance: ✅');
        console.log(`      Proprietário esperado: ${property.proprietario}`);
        console.log(`      Matches owner: ${property.proprietario.toLowerCase() === owner.toLowerCase() ? '✅' : '❌'}`);
      } catch (e) {
        console.log('   5. Property registrada no compliance: ❌ NÃO ENCONTRADA');
        console.log('      Erro:', e.message);
      }
    } catch (e) {
      console.log('   Erro ao verificar compliance:', e.message);
    }

    console.log('\n💡 Diagnóstico final:');
    if (!isAgent) {
      console.log('❌ Admin não é Agent - não pode emitir títulos');
    } else if (!isVerified) {
      console.log('❌ Owner não está verificado no IdentityRegistry');
    } else if (exists) {
      console.log('❌ Property já existe (matrícula duplicada)');
    } else {
      console.log('✅ Todas as verificações básicas passaram');
      console.log('⚠️  Mas a transação ainda falha - provável problema no compliance');
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

debug();
