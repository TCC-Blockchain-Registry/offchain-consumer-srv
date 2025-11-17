const { ethers } = require('ethers');
const PropertyTitleABI = require('./src/abis/PropertyTitleTREX.json');

class LegacyProvider extends ethers.JsonRpcProvider {
  async getFeeData() { return new ethers.FeeData(ethers.toBigInt(1000), null, null); }
  async resolveName(name) { return null; }
}

async function checkStatus() {
  const provider = new LegacyProvider('http://127.0.0.1:8545', { chainId: 1337, name: 'besu-private' });
  const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  const propertyContract = new ethers.Contract(process.env.PROPERTY_TITLE_ADDRESS, PropertyTitleABI, adminWallet);

  const matricula = 8;
  const beneficiary = "0x3b59b80bef76afce7d0a0d19eeef73045a87816c";
  
  // Calcular requestHash
  const requestHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "address"],
      [matricula, beneficiary]
    )
  );
  
  console.log(`🔍 Verificando matricula ${matricula}:`);
  console.log(`   Beneficiary: ${beneficiary}`);
  console.log(`   Request Hash: ${requestHash}`);
  console.log('');
  
  // Verificar se a propriedade existe
  const exists = await propertyContract.propertyExists(matricula);
  console.log(`✅ Propriedade existe: ${exists}`);
  
  if (exists) {
    const owner = await propertyContract.propertyOwner(matricula);
    console.log(`   Owner: ${owner}`);
  }
  
  console.log('');
  console.log('📋 Tentando buscar status do request...');
  
  try {
    // Tentar chamar a função view que retorna o status
    const pendingReg = await propertyContract.pendingRegistrations(requestHash);
    
    console.log('   Status do PendingRegistration:');
    console.log(`     exists: ${pendingReg.exists}`);
    console.log(`     matricula: ${pendingReg.matricula}`);
    console.log(`     beneficiary: ${pendingReg.beneficiary}`);
    console.log(`     financialApproved: ${pendingReg.financialApproved}`);
    console.log(`     registryOfficeApproved: ${pendingReg.registryOfficeApproved}`);
    console.log(`     municipalityApproved: ${pendingReg.municipalityApproved}`);
    console.log(`     executed: ${pendingReg.executed}`);
  } catch (error) {
    console.log(`   ⚠️  Erro ao buscar: ${error.message}`);
  }
}

checkStatus().catch(console.error);
