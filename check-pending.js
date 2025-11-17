const { ethers } = require('ethers');
const PropertyTitleABI = require('./src/abis/PropertyTitleTREX.json');

class LegacyProvider extends ethers.JsonRpcProvider {
  async getFeeData() { return new ethers.FeeData(ethers.toBigInt(1000), null, null); }
  async resolveName(name) { return null; }
}

async function checkPending() {
  const provider = new LegacyProvider(process.env.RPC_URL, { chainId: 1337, name: 'besu-private' });
  const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  const propertyContract = new ethers.Contract(process.env.PROPERTY_TITLE_ADDRESS, PropertyTitleABI, adminWallet);

  const matricula = 2;
  const beneficiary = "0x3b59b80bef76afce7d0a0d19eeef73045a87816c";
  
  // Calcular requestHash da mesma forma que o contrato
  const requestHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "address"],
      [matricula, beneficiary]
    )
  );
  
  console.log(`🔍 Verificando request pendente:`);
  console.log(`   Matricula: ${matricula}`);
  console.log(`   Beneficiary: ${beneficiary}`);
  console.log(`   Request Hash: ${requestHash}`);
  console.log('');
  
  try {
    const status = await propertyContract.registrationRequests(requestHash);
    console.log('   Status:');
    console.log(`     matricula: ${status.matricula}`);
    console.log(`     beneficiary: ${status.beneficiary}`);
    console.log(`     exists: ${status.exists}`);
    console.log(`     financialApproved: ${status.financialApproved}`);
    console.log(`     registryOfficeApproved: ${status.registryOfficeApproved}`);
    console.log(`     municipalityApproved: ${status.municipalityApproved}`);
    console.log(`     executed: ${status.executed}`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
}

checkPending().catch(console.error);
