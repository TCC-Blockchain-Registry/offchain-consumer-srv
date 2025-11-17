#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

class LegacyProvider extends ethers.JsonRpcProvider {
  async getBlock(blockHashOrBlockTag, prefetchTxs) {
    const block = await super.getBlock(blockHashOrBlockTag, prefetchTxs);
    if (block) {
      block.baseFeePerGas = null;
    }
    return block;
  }

  async getFeeData() {
    return new ethers.FeeData(BigInt(1000), null, null);
  }

  async resolveName(name) {
    return null;
  }
}

async function checkRoles() {
  try {
    console.log('\n🔍 Verificando roles do admin\n');

    const provider = new LegacyProvider(process.env.RPC_URL, {
      chainId: Number(process.env.CHAIN_ID) || 1337,
      name: 'besu-private',
    });

    const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    console.log('👤 Admin wallet:', adminWallet.address);

    // Carregar ABIs
    const PropertyTitleABI = require('./src/abis/PropertyTitleTREX.json');
    const IdentityRegistryABI = require('./src/abis/IdentityRegistry.json');
    
    const propertyTitle = new ethers.Contract(
      process.env.PROPERTY_TITLE_ADDRESS,
      PropertyTitleABI,
      provider
    );

    const identityRegistry = new ethers.Contract(
      process.env.IDENTITY_REGISTRY_ADDRESS,
      IdentityRegistryABI,
      provider
    );

    console.log('\n📋 Verificando no PropertyTitleTREX:');
    
    // Verificar se é Agent
    const isAgent = await propertyTitle.isAgent(adminWallet.address);
    console.log('   É Agent?', isAgent ? '✅ SIM' : '❌ NÃO');

    // Verificar owner
    const owner = await propertyTitle.owner();
    console.log('   Owner do contrato:', owner);
    console.log('   É owner?', owner.toLowerCase() === adminWallet.address.toLowerCase() ? '✅ SIM' : '❌ NÃO');

    console.log('\n📋 Verificando no IdentityRegistry:');
    
    // Verificar se admin está verificado
    const isVerified = await identityRegistry.isVerified(adminWallet.address);
    console.log('   Está verificado?', isVerified ? '✅ SIM' : '❌ NÃO');

    // Verificar identidade
    const identity = await identityRegistry.identity(adminWallet.address);
    console.log('   Endereço da identidade:', identity);

    // Verificar se é Agent do Identity Registry
    const isIRAgent = await identityRegistry.isAgent(adminWallet.address);
    console.log('   É Agent do IdentityRegistry?', isIRAgent ? '✅ SIM' : '❌ NÃO');

    console.log('\n💡 Diagnóstico:');
    if (!isAgent) {
      console.log('❌ O admin NÃO é Agent do PropertyTitleTREX');
      console.log('   Isso impede que ele emita títulos de propriedade');
      console.log('   Solução: Adicionar admin como Agent');
      console.log('   Comando: propertyTitle.addAgent(adminAddress)');
    } else {
      console.log('✅ Admin tem permissões corretas');
    }

    if (!isVerified) {
      console.log('❌ O admin NÃO está verificado no IdentityRegistry');
      console.log('   Solução: Registrar identidade do admin');
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

checkRoles();
