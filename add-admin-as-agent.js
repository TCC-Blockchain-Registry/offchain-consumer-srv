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

async function addAdminAsAgent() {
  try {
    console.log('\n🔧 Adicionando admin como Agent do PropertyTitleTREX\n');

    const provider = new LegacyProvider(process.env.RPC_URL, {
      chainId: Number(process.env.CHAIN_ID) || 1337,
      name: 'besu-private',
    });

    const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    console.log('👤 Admin wallet:', adminWallet.address);

    const PropertyTitleABI = require('./src/abis/PropertyTitleTREX.json');
    
    const propertyTitle = new ethers.Contract(
      process.env.PROPERTY_TITLE_ADDRESS,
      PropertyTitleABI,
      adminWallet
    );

    // Verificar owner atual
    const owner = await propertyTitle.owner();
    console.log('📋 Owner do contrato:', owner);

    console.log('\n🔧 Tentando adicionar admin como Agent...');

    try {
      const tx = await propertyTitle.addAgent(adminWallet.address, {
        type: 0,
        gasLimit: 200000,
        gasPrice: 1000
      });
      
      console.log('   TX Hash:', tx.hash);
      console.log('   Aguardando confirmação...');
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log('✅ Admin adicionado como Agent com sucesso!');
        console.log('   Block:', receipt.blockNumber);
        
        // Verificar
        const isAgent = await propertyTitle.isAgent(adminWallet.address);
        console.log('\n✅ Verificação: É Agent?', isAgent ? 'SIM' : 'NÃO');
        
        console.log('\n🎉 Pronto! Agora você pode emitir títulos de propriedade.');
        
      } else {
        console.log('❌ Transação falhou (status 0)');
      }
      
    } catch (error) {
      console.error('❌ Erro ao adicionar Agent:', error.message);
      
      // Se a transação falhar por falta de permissão, pode ser que o contrato
      // seja upgradeable e o owner seja o próprio contrato
      if (error.message.includes('Ownable')) {
        console.log('\n💡 O contrato usa padrão Ownable e o owner é o próprio contrato.');
        console.log('   Você precisa chamar addAgent através do owner (que é o contrato).');
        console.log('   Isso pode requerer uma função especial de inicialização ou um proxy admin.');
      }
      
      throw error;
    }

  } catch (error) {
    console.error('\n❌ Falhou:', error.message);
    process.exit(1);
  }
}

addAdminAsAgent();
