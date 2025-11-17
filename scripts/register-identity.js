#!/usr/bin/env node

/**
 * Script para registrar identidade de um wallet no Identity Registry
 * Uso: node scripts/register-identity.js <WALLET_ADDRESS>
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

async function registerIdentity(walletAddress) {
  try {
    console.log(`\n🔐 Registrando identidade para: ${walletAddress}\n`);

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

    // Verificar se já está registrado
    console.log(`\n📋 Verificando identidade existente...`);
    const isVerified = await identityRegistry.isVerified(walletAddress);
    
    if (isVerified) {
      console.log(`✅ Wallet já tem identidade registrada!`);
      return { success: true, alreadyRegistered: true };
    }

    console.log(`📝 Registrando nova identidade...`);
    
    // Registrar identidade
    const tx = await identityRegistry.registerIdentity(
      walletAddress,
      ethers.ZeroAddress, // Identity contract (simplificado para dev)
      76, // Country code: Brasil
      {
        type: 0,
        gasLimit: 300000,
        gasPrice: 1000
      }
    );

    console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
    const receipt = await tx.wait();
    
    console.log(`✅ Identidade registrada com sucesso!`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   TX Hash: ${tx.hash}\n`);

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      alreadyRegistered: false
    };

  } catch (error) {
    console.error(`❌ Erro ao registrar identidade:`, error.message);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const walletAddress = process.argv[2];

  if (!walletAddress) {
    console.error('\n❌ Erro: Endereço da carteira não fornecido!');
    console.log('\n📖 Uso: node scripts/register-identity.js <WALLET_ADDRESS>\n');
    console.log('Exemplo:');
    console.log('  node scripts/register-identity.js 0x3b59b80bef76afce7d0a0d19eeef73045a87816c\n');
    process.exit(1);
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    console.error('\n❌ Erro: Endereço de carteira inválido!');
    console.log('   Deve começar com 0x e ter 40 caracteres hexadecimais.\n');
    process.exit(1);
  }

  registerIdentity(walletAddress)
    .then((result) => {
      console.log('✅ Concluído:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falhou:', error.message);
      process.exit(1);
    });
}

module.exports = { registerIdentity };

