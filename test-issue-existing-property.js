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

async function test() {
  try {
    console.log('\n🏠 Testando emissão de título para property JÁ REGISTRADA\n');

    const provider = new LegacyProvider(process.env.RPC_URL, {
      chainId: Number(process.env.CHAIN_ID) || 1337,
      name: 'besu-private',
    });

    const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    
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
      provider
    );

    // Matrícula que foi registrada no teste anterior
    const matricula = 777666;
    const owner = adminWallet.address;

    console.log('📋 Verificando se property está registrada no compliance...');
    try {
      const property = await registryModule.getProperty(matricula);
      console.log('✅ Property encontrada!');
      console.log('   Endereço:', property.endereco);
      console.log('   Proprietário:', property.proprietario);
    } catch (e) {
      console.log('❌ Property NÃO encontrada - registrando agora...');
      
      const tx1 = await registryModule.connect(adminWallet).registerProperty({
        matriculaId: matricula,
        folha: 150,
        comarca: 'Rio de Janeiro - RJ',
        endereco: 'Rua Teste Completo, 789',
        metragem: 200,
        proprietario: owner,
        matriculaOrigem: 0,
        tipo: 0,
        isRegular: true
      }, {
        type: 0,
        gasLimit: 500000,
        gasPrice: 1000
      });
      
      console.log('   TX:', tx1.hash);
      await tx1.wait();
      console.log('✅ Registrada!');
      
      // Aguardar propagação
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n🏠 Emitindo título de propriedade...');
    
    const tx = await propertyTitle.issueProperty(owner, matricula, {
      type: 0,
      gasLimit: 500000,
      gasPrice: 1000
    });
    
    console.log('   TX Hash:', tx.hash);
    console.log('   Aguardando confirmação...');
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('✅ TÍTULO EMITIDO COM SUCESSO!');
      console.log('   Block:', receipt.blockNumber);
      console.log('   Gas usado:', receipt.gasUsed.toString());
      
      // Verificar eventos
      console.log('\n📋 Eventos:');
      receipt.logs.forEach((log) => {
        try {
          const parsed = propertyTitle.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          if (parsed) {
            console.log(`   ✅ ${parsed.name}`);
            if (parsed.name === 'PropertyIssued') {
              console.log('      Matrícula:', parsed.args.matricula.toString());
              console.log('      Owner:', parsed.args.owner);
            }
          }
        } catch (e) {}
      });
      
      // Verificar saldo
      console.log('\n💰 Verificando resultado:');
      const balance = await propertyTitle.balanceOf(owner);
      const totalSupply = await propertyTitle.totalSupply();
      console.log('   Balance do admin:', balance.toString());
      console.log('   Total Supply:', totalSupply.toString());
      
      console.log('\n🎉 TESTE BEM-SUCEDIDO! A comunicação está 100% funcional!\n');
      
    } else {
      console.log('❌ Transação falhou (status 0)');
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.receipt) {
      console.error('   Status:', error.receipt.status);
      console.error('   Gas usado:', error.receipt.gasUsed.toString());
    }
    process.exit(1);
  }
}

test();
