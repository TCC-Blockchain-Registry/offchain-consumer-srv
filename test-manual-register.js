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

async function testManualRegister() {
  try {
    console.log('\n🔧 Teste Manual de Registro de Propriedade\n');

    const provider = new LegacyProvider(process.env.RPC_URL, {
      chainId: Number(process.env.CHAIN_ID) || 1337,
      name: 'besu-private',
    });

    const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    console.log('👤 Admin wallet:', adminWallet.address);

    // Carregar ABIs
    const PropertyTitleABI = require('./src/abis/PropertyTitleTREX.json');
    const RegistryModuleABI = require('./src/abis/RegistryMDCompliance.json');
    
    const propertyTitle = new ethers.Contract(
      process.env.PROPERTY_TITLE_ADDRESS,
      PropertyTitleABI,
      adminWallet
    );

    const registryModule = new ethers.Contract(
      process.env.REGISTRY_MODULE_ADDRESS,
      RegistryModuleABI,
      adminWallet
    );

    // Dados da propriedade
    const matriculaId = 777666;
    const propertyInfo = {
      matriculaId: matriculaId,
      folha: 150,
      comarca: 'Rio de Janeiro - RJ',
      endereco: 'Rua Teste Manual, 456',
      metragem: 180,
      proprietario: adminWallet.address, // Admin como proprietário (já tem identidade)
      matriculaOrigem: 0,
      tipo: 0, // URBANO
      isRegular: true
    };

    console.log('\n📝 PASSO 1: Registrando propriedade no módulo de compliance...');
    console.log('   Matrícula:', matriculaId);
    console.log('   Proprietário:', propertyInfo.proprietario);

    try {
      const tx1 = await registryModule.registerProperty(propertyInfo, {
        type: 0,
        gasLimit: 500000,
        gasPrice: 1000
      });
      
      console.log('   TX Hash:', tx1.hash);
      console.log('   Aguardando confirmação...');
      
      const receipt1 = await tx1.wait();
      console.log('✅ Propriedade registrada no compliance! Block:', receipt1.blockNumber);
      
    } catch (error) {
      console.error('❌ Erro ao registrar no compliance:', error.message);
      throw error;
    }

    console.log('\n⏳ Aguardando propagação (3 segundos)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n🏠 PASSO 2: Emitindo título de propriedade (mint token)...');

    try {
      const tx2 = await propertyTitle.issueProperty(
        propertyInfo.proprietario,
        matriculaId,
        {
          type: 0,
          gasLimit: 500000,
          gasPrice: 1000
        }
      );
      
      console.log('   TX Hash:', tx2.hash);
      console.log('   Aguardando confirmação...');
      
      const receipt2 = await tx2.wait();
      console.log('✅ Título emitido! Block:', receipt2.blockNumber);
      console.log('   Status:', receipt2.status === 1 ? 'SUCCESS' : 'FAILED');
      
      // Verificar eventos
      console.log('\n📋 Eventos emitidos:');
      receipt2.logs.forEach((log, i) => {
        try {
          const parsed = propertyTitle.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          if (parsed) {
            console.log(`   ${i + 1}. ${parsed.name}`);
            console.log('      Args:', parsed.args);
          }
        } catch (e) {
          // Evento de outro contrato
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao emitir título:', error.message);
      
      if (error.receipt) {
        console.error('   Status da transação:', error.receipt.status);
        console.error('   Gas usado:', error.receipt.gasUsed.toString());
      }
      
      throw error;
    }

    console.log('\n✅ Registro completo bem-sucedido!');
    console.log('\n📊 Verificando resultado...');
    
    const balance = await propertyTitle.balanceOf(adminWallet.address);
    const totalSupply = await propertyTitle.totalSupply();
    
    console.log('   Balance do admin:', balance.toString());
    console.log('   Total Supply:', totalSupply.toString());

    console.log('\n🎉 Teste concluído com sucesso!\n');

  } catch (error) {
    console.error('\n❌ Teste falhou:', error.message);
    process.exit(1);
  }
}

testManualRegister();
