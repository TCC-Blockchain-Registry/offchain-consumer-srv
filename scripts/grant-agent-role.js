#!/usr/bin/env node

/**
 * Script para dar permissão AGENT_ROLE ao adminWallet no Identity Registry
 * Isso permite que o admin registre identidades de novos proprietários
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Provider customizado para Besu
class LegacyProvider extends ethers.JsonRpcProvider {
  async getFeeData() {
    return {
      gasPrice: ethers.toBigInt(1000),
      maxFeePerGas: null,
      maxPriorityFeePerGas: null
    };
  }

  async resolveName(name) {
    return null;
  }
}

async function grantAgentRole() {
  try {
    console.log('\n🔐 Concedendo AGENT_ROLE ao adminWallet...\n');

    // Setup provider e admin wallet
    const provider = new LegacyProvider(process.env.RPC_URL, {
      chainId: Number(process.env.CHAIN_ID) || 1337,
      name: 'besu-private',
    });

    const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    console.log(`👤 Admin wallet: ${adminWallet.address}`);

    // Carregar contrato Identity Registry
    const IdentityRegistryABI = require('../src/abis/IdentityRegistry.json');
    const identityRegistry = new ethers.Contract(
      process.env.IDENTITY_REGISTRY_ADDRESS,
      IdentityRegistryABI,
      adminWallet
    );

    // Verificar owner do contrato
    console.log('\n📋 Verificando permissões...');
    try {
      const owner = await identityRegistry.owner();
      console.log(`👑 Owner do contrato: ${owner}`);
      console.log(`   Admin wallet: ${adminWallet.address}`);
      console.log(`   Match: ${owner.toLowerCase() === adminWallet.address.toLowerCase()}`);
    } catch (e) {
      console.log('ℹ️  Não foi possível verificar owner (contrato pode não ter essa função)');
    }

    // O AGENT_ROLE é o hash keccak256("AGENT_ROLE")
    const AGENT_ROLE = ethers.id("AGENT_ROLE");
    console.log(`\n🔑 AGENT_ROLE: ${AGENT_ROLE}`);

    // Verificar se já tem a role
    try {
      const hasRole = await identityRegistry.hasRole(AGENT_ROLE, adminWallet.address);
      console.log(`   Admin já tem AGENT_ROLE: ${hasRole}`);
      
      if (hasRole) {
        console.log('\n✅ Admin wallet já tem permissão AGENT_ROLE!');
        return { success: true, alreadyGranted: true };
      }
    } catch (e) {
      console.log('ℹ️  Não foi possível verificar role (pode não existir hasRole)');
    }

    // Tentar conceder a role
    console.log('\n📝 Concedendo AGENT_ROLE...');
    
    try {
      const tx = await identityRegistry.grantRole(AGENT_ROLE, adminWallet.address, {
        type: 0,
        gasLimit: 100000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      const receipt = await tx.wait();
      
      console.log(`✅ AGENT_ROLE concedida com sucesso!`);
      console.log(`   Block: ${receipt.blockNumber}`);
      console.log(`   TX Hash: ${tx.hash}\n`);

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        alreadyGranted: false
      };
    } catch (error) {
      // Se falhar, pode ser que o contrato use addAgent ou outra função
      console.log(`\n⚠️  grantRole() falhou, tentando addAgent()...`);
      
      try {
        const tx = await identityRegistry.addAgent(adminWallet.address, {
          type: 0,
          gasLimit: 100000,
          gasPrice: 1000
        });

        console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
        const receipt = await tx.wait();
        
        console.log(`✅ Agent adicionado com sucesso!`);
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   TX Hash: ${tx.hash}\n`);

        return {
          success: true,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber,
          alreadyGranted: false,
          method: 'addAgent'
        };
      } catch (error2) {
        console.error(`❌ Ambos grantRole() e addAgent() falharam!`);
        console.error(`   Error grantRole: ${error.message}`);
        console.error(`   Error addAgent: ${error2.message}`);
        throw error2;
      }
    }

  } catch (error) {
    console.error(`\n❌ Erro ao conceder AGENT_ROLE:`, error.message);
    console.error('\n💡 Possíveis causas:');
    console.error('   1. O adminWallet não é o owner do contrato Identity Registry');
    console.error('   2. O contrato não tem as funções grantRole() ou addAgent()');
    console.error('   3. O contrato usa um sistema de permissões diferente');
    console.error('\n📖 Sugestão:');
    console.error('   Execute o script de deploy novamente ou use a carteira que deployou os contratos');
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  grantAgentRole()
    .then((result) => {
      console.log('✅ Concluído:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falhou:', error.message);
      process.exit(1);
    });
}

module.exports = { grantAgentRole };

