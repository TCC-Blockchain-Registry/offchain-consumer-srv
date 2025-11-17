#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

// Provider customizado
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

async function registerIdentityAndProperty() {
  try {
    console.log('\n🔧 Teste Completo: Registrar Identidade + Propriedade\n');

    // Setup provider e wallet
    const provider = new LegacyProvider(process.env.RPC_URL, {
      chainId: Number(process.env.CHAIN_ID) || 1337,
      name: 'besu-private',
    });

    const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    console.log('👤 Admin wallet:', adminWallet.address);

    // Carregar ABIs e criar contratos
    const PropertyTitleABI = require('./src/abis/PropertyTitleTREX.json');
    const IdentityABI = require('./src/abis/IdentityRegistry.json');
    
    const propertyTitle = new ethers.Contract(
      process.env.PROPERTY_TITLE_ADDRESS,
      PropertyTitleABI,
      adminWallet
    );

    const identityRegistry = new ethers.Contract(
      process.env.IDENTITY_REGISTRY_ADDRESS,
      IdentityABI,
      adminWallet
    );

    // Verificar se admin já tem identidade registrada
    console.log('\n📋 Verificando identidade do admin...');
    const adminIdentity = await identityRegistry.identity(adminWallet.address);
    console.log('   Identidade:', adminIdentity);

    if (adminIdentity === '0x0000000000000000000000000000000000000000') {
      console.log('❌ Admin não tem identidade registrada');
      console.log('💡 Precisamos registrar a identidade primeiro via deploy script ou manualmente');
      console.log('   O deploy script já deveria ter feito isso...');
    } else {
      console.log('✅ Admin tem identidade registrada:', adminIdentity);
    }

    // Testar chamada de leitura simples
    console.log('\n📊 Testando leitura de dados do contrato...');
    const tokenName = await propertyTitle.name();
    const totalSupply = await propertyTitle.totalSupply();
    console.log('   Token:', tokenName);
    console.log('   Total Supply:', totalSupply.toString());

    console.log('\n✅ Teste de leitura bem-sucedido!');
    console.log('\n💡 Para testar transações de escrita:');
    console.log('   1. Certifique-se de que a identidade do proprietário está registrada');
    console.log('   2. Use a API: POST /api/properties/register');
    console.log('   3. O proprietário deve ser o admin (que já tem identidade):\n');
    console.log(`      "proprietario": "${adminWallet.address}"\n`);

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

registerIdentityAndProperty();
