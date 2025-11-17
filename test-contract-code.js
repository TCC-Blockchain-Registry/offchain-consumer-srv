const { ethers } = require('ethers');
require('dotenv').config();

async function checkContract() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const address = process.env.PROPERTY_TITLE_ADDRESS;
  
  console.log('🔍 Verificando contrato em:', address);
  
  const code = await provider.getCode(address);
  console.log('📝 Tamanho do código:', code.length, 'bytes');
  console.log('✅ Contrato existe:', code !== '0x');
  
  // Verificar outros contratos
  const contracts = {
    'PropertyTitle': process.env.PROPERTY_TITLE_ADDRESS,
    'ApprovalsModule': process.env.APPROVALS_MODULE_ADDRESS,
    'RegistryModule': process.env.REGISTRY_MODULE_ADDRESS,
    'ApproversRegistry': process.env.APPROVERS_REGISTRY_ADDRESS,
  };
  
  console.log('\n📋 Verificando todos os contratos:');
  for (const [name, addr] of Object.entries(contracts)) {
    const code = await provider.getCode(addr);
    console.log(`  ${name}: ${code !== '0x' ? '✅ OK' : '❌ NÃO ENCONTRADO'} (${code.length} bytes)`);
  }
}

checkContract();
