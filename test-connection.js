#!/usr/bin/env node

/**
 * Script para testar a conexão com a blockchain Besu
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Provider customizado para transações Legacy
class LegacyProvider extends ethers.JsonRpcProvider {
  async getBlock(blockHashOrBlockTag, prefetchTxs) {
    const block = await super.getBlock(blockHashOrBlockTag, prefetchTxs);
    if (block) {
      block.baseFeePerGas = null;
    }
    return block;
  }

  async getFeeData() {
    return new ethers.FeeData(
      BigInt(1000),
      null,
      null
    );
  }

  async resolveName(name) {
    return null;
  }
}

async function testConnection() {
  console.log('\n🔍 Testando conexão com blockchain Besu...\n');

  try {
    // Criar provider
    const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
    const provider = new LegacyProvider(rpcUrl, {
      chainId: Number(process.env.CHAIN_ID) || 1337,
      name: 'besu-private',
    });

    // Testar conexão
    console.log('📡 Conectando ao RPC:', rpcUrl);
    const network = await provider.getNetwork();
    console.log('✅ Conectado à rede:', network.name, '(Chain ID:', network.chainId.toString() + ')');

    // Obter número do bloco
    const blockNumber = await provider.getBlockNumber();
    console.log('📦 Último bloco:', blockNumber);

    // Criar wallet
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey) {
      throw new Error('ADMIN_PRIVATE_KEY não encontrada no .env');
    }
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    console.log('👤 Admin wallet:', adminWallet.address);

    // Obter saldo
    const balance = await provider.getBalance(adminWallet.address);
    console.log('💰 Saldo:', ethers.formatEther(balance), 'ETH');

    // Testar contratos
    console.log('\n📋 Endereços dos contratos:');
    console.log('  PropertyTitle:', process.env.PROPERTY_TITLE_ADDRESS);
    console.log('  ApprovalsModule:', process.env.APPROVALS_MODULE_ADDRESS);
    console.log('  RegistryModule:', process.env.REGISTRY_MODULE_ADDRESS);
    console.log('  ApproversRegistry:', process.env.APPROVERS_REGISTRY_ADDRESS);
    console.log('  IdentityRegistry:', process.env.IDENTITY_REGISTRY_ADDRESS);
    console.log('  Compliance:', process.env.MODULAR_COMPLIANCE_ADDRESS);

    // Carregar ABIs
    console.log('\n📝 Carregando ABIs...');
    const PropertyTitleABI = require('./src/abis/PropertyTitleTREX.json');
    const ApprovalsModuleABI = require('./src/abis/ApprovalsModule.json');
    const RegistryModuleABI = require('./src/abis/RegistryMDCompliance.json');
    console.log('✅ ABIs carregados com sucesso');

    // Testar leitura do contrato PropertyTitle
    console.log('\n🔍 Testando leitura do contrato PropertyTitle...');
    const propertyTitle = new ethers.Contract(
      process.env.PROPERTY_TITLE_ADDRESS,
      PropertyTitleABI,
      provider
    );

    const tokenName = await propertyTitle.name();
    const tokenSymbol = await propertyTitle.symbol();
    const decimals = await propertyTitle.decimals();
    
    console.log('✅ Token info:');
    console.log('  Nome:', tokenName);
    console.log('  Símbolo:', tokenSymbol);
    console.log('  Decimais:', decimals.toString());

    console.log('\n✅ Todos os testes passaram! 🎉');
    console.log('\n💡 A comunicação entre offchain-consumer-srv e blockchain está funcionando!\n');

  } catch (error) {
    console.error('\n❌ Erro ao testar conexão:', error.message);
    console.error('\n💡 Verifique:');
    console.error('   1. Se o arquivo .env existe e está configurado');
    console.error('   2. Se a blockchain Besu está rodando');
    console.error('   3. Se os endereços dos contratos estão corretos\n');
    process.exit(1);
  }
}

testConnection();

