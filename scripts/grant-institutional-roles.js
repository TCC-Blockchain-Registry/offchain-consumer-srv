#!/usr/bin/env node

/**
 * Script para conceder roles institucionais no PropertyTitleTREX
 * Roles: FINANCIAL_ROLE, REGISTRY_OFFICE_ROLE, MUNICIPALITY_ROLE
 *
 * Uso:
 *   npm run grant-roles
 *   ou
 *   npm run grant-roles -- <FINANCIAL_ADDR> <REGISTRY_ADDR> <MUNICIPALITY_ADDR>
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

/**
 * Concede uma role específica para um endereço
 */
async function grantRole(token, roleName, roleHash, targetAddress, adminAddress) {
  console.log(`\n🔑 Concedendo ${roleName}...`);
  console.log(`   Para: ${targetAddress}`);

  // Verificar se já tem a role
  try {
    const hasRole = await token.hasRole(roleHash, targetAddress);

    if (hasRole) {
      console.log(`⚠️  ${targetAddress} já possui ${roleName}`);
      return { success: true, alreadyGranted: true, roleName };
    }
  } catch (e) {
    console.log(`⚠️  Não foi possível verificar role: ${e.message}`);
  }

  // Conceder role
  try {
    const tx = await token.grantRole(roleHash, targetAddress, {
      type: 0,
      gasLimit: 100000,
      gasPrice: 1000
    });

    console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
    const receipt = await tx.wait();

    console.log(`✅ ${roleName} concedida com sucesso!`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   TX Hash: ${tx.hash}`);

    // Verificar se foi concedida
    const hasRole = await token.hasRole(roleHash, targetAddress);
    if (!hasRole) {
      throw new Error('Role não foi concedida corretamente');
    }

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      alreadyGranted: false,
      roleName
    };
  } catch (error) {
    console.error(`❌ Erro ao conceder ${roleName}: ${error.message}`);
    throw error;
  }
}

/**
 * Função principal para conceder todas as roles institucionais
 */
async function grantInstitutionalRoles(options = {}) {
  try {
    console.log('\n========================================');
    console.log('🔐 Concedendo Roles Institucionais');
    console.log('========================================\n');

    // Setup provider e admin wallet
    const provider = new LegacyProvider(process.env.RPC_URL || 'http://localhost:8545', {
      chainId: Number(process.env.CHAIN_ID) || 1337,
      name: 'besu-private',
    });

    const adminWallet = new ethers.Wallet(
      process.env.ADMIN_PRIVATE_KEY || process.env.PRIVATE_KEY,
      provider
    );

    console.log(`👤 Admin wallet: ${adminWallet.address}`);

    // Endereços alvo (usar admin como padrão para desenvolvimento)
    const financialAddress = options.financialAddress || adminWallet.address;
    const registryOfficeAddress = options.registryOfficeAddress || adminWallet.address;
    const municipalityAddress = options.municipalityAddress || adminWallet.address;

    console.log('\n📋 Roles a serem concedidas:');
    console.log(`   FINANCIAL_ROLE       → ${financialAddress}`);
    console.log(`   REGISTRY_OFFICE_ROLE → ${registryOfficeAddress}`);
    console.log(`   MUNICIPALITY_ROLE    → ${municipalityAddress}`);

    // Carregar contrato PropertyTitleTREX
    const tokenAddress = process.env.TOKEN_ADDRESS;
    if (!tokenAddress) {
      throw new Error('TOKEN_ADDRESS não configurado no .env');
    }

    console.log(`\n📄 PropertyTitleTREX: ${tokenAddress}`);

    const PropertyTitleTREXABI = require('../src/abis/PropertyTitleTREX.json');
    const token = new ethers.Contract(
      tokenAddress,
      PropertyTitleTREXABI.abi || PropertyTitleTREXABI,
      adminWallet
    );

    // Calcular hashes das roles
    const FINANCIAL_ROLE = ethers.id("FINANCIAL_ROLE");
    const REGISTRY_OFFICE_ROLE = ethers.id("REGISTRY_OFFICE_ROLE");
    const MUNICIPALITY_ROLE = ethers.id("MUNICIPALITY_ROLE");

    console.log('\n🔑 Role hashes:');
    console.log(`   FINANCIAL_ROLE:       ${FINANCIAL_ROLE}`);
    console.log(`   REGISTRY_OFFICE_ROLE: ${REGISTRY_OFFICE_ROLE}`);
    console.log(`   MUNICIPALITY_ROLE:    ${MUNICIPALITY_ROLE}`);

    // Verificar se admin tem DEFAULT_ADMIN_ROLE
    console.log('\n🔍 Verificando permissões do admin...');
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash; // 0x00...00
    const isAdmin = await token.hasRole(DEFAULT_ADMIN_ROLE, adminWallet.address);
    console.log(`   Admin tem DEFAULT_ADMIN_ROLE: ${isAdmin}`);

    if (!isAdmin) {
      throw new Error('Admin wallet não tem DEFAULT_ADMIN_ROLE. Use a carteira que deployou os contratos.');
    }

    // Conceder cada role
    const results = [];

    console.log('\n========================================');
    console.log('⏳ Concedendo roles...');
    console.log('========================================');

    results.push(await grantRole(
      token,
      'FINANCIAL_ROLE',
      FINANCIAL_ROLE,
      financialAddress,
      adminWallet.address
    ));

    results.push(await grantRole(
      token,
      'REGISTRY_OFFICE_ROLE',
      REGISTRY_OFFICE_ROLE,
      registryOfficeAddress,
      adminWallet.address
    ));

    results.push(await grantRole(
      token,
      'MUNICIPALITY_ROLE',
      MUNICIPALITY_ROLE,
      municipalityAddress,
      adminWallet.address
    ));

    // Verificação final
    console.log('\n========================================');
    console.log('🔍 Verificação Final');
    console.log('========================================\n');

    const verifyRole = async (roleName, roleHash, address) => {
      const hasRole = await token.hasRole(roleHash, address);
      const status = hasRole ? '✅' : '❌';
      console.log(`${status} ${roleName.padEnd(25)} ${address}`);
      return hasRole;
    };

    const allGranted = [
      await verifyRole('FINANCIAL_ROLE', FINANCIAL_ROLE, financialAddress),
      await verifyRole('REGISTRY_OFFICE_ROLE', REGISTRY_OFFICE_ROLE, registryOfficeAddress),
      await verifyRole('MUNICIPALITY_ROLE', MUNICIPALITY_ROLE, municipalityAddress)
    ].every(Boolean);

    console.log('\n========================================');
    if (allGranted) {
      console.log('✅ Todas as roles concedidas com sucesso!');
    } else {
      console.log('⚠️  Algumas roles não foram concedidas');
    }
    console.log('========================================\n');

    return {
      success: allGranted,
      results,
      addresses: {
        financial: financialAddress,
        registryOffice: registryOfficeAddress,
        municipality: municipalityAddress
      }
    };

  } catch (error) {
    console.error(`\n❌ Erro ao conceder roles institucionais:`, error.message);
    console.error('\n💡 Possíveis causas:');
    console.error('   1. O adminWallet não é o owner do contrato PropertyTitleTREX');
    console.error('   2. TOKEN_ADDRESS não está configurado corretamente no .env');
    console.error('   3. O contrato não foi deployado ou está em um endereço diferente');
    console.error('   4. A rede Besu não está rodando');
    console.error('\n📖 Sugestão:');
    console.error('   Verifique o arquivo .env e garanta que TOKEN_ADDRESS está correto');
    console.error('   Use a mesma PRIVATE_KEY que deployou os contratos');
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  // Processar argumentos da linha de comando
  const args = process.argv.slice(2);

  const options = {};
  if (args.length >= 1) options.financialAddress = args[0];
  if (args.length >= 2) options.registryOfficeAddress = args[1];
  if (args.length >= 3) options.municipalityAddress = args[2];

  if (args.length > 0) {
    console.log('\n📝 Usando endereços customizados dos argumentos');
  } else {
    console.log('\n📝 Usando endereço admin para todas as roles (desenvolvimento)');
  }

  grantInstitutionalRoles(options)
    .then((result) => {
      console.log('✅ Concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falhou:', error.message);
      process.exit(1);
    });
}

module.exports = { grantInstitutionalRoles, grantRole };
