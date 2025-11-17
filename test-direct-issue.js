const { ethers } = require('ethers');
const PropertyTitleABI = require('./src/abis/PropertyTitleTREX.json');

class LegacyProvider extends ethers.JsonRpcProvider {
  async getFeeData() { return new ethers.FeeData(ethers.toBigInt(1000), null, null); }
  async resolveName(name) { return null; }
}

async function testDirectIssue() {
  const provider = new LegacyProvider('http://127.0.0.1:8545', { chainId: 1337, name: 'besu-private' });
  const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  const propertyContract = new ethers.Contract(process.env.PROPERTY_TITLE_ADDRESS, PropertyTitleABI, adminWallet);

  console.log('🏠 Tentando issueProperty direto...');
  
  try {
    const tx = await propertyContract.issueProperty(
      '0x565524f400856766f11562832eB809d889491a01',
      9991234,
      { type: 0, gasLimit: 250000, gasPrice: 1000 }
    );
    await tx.wait();
    console.log(`✅ Sucesso! TX: ${tx.hash}`);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testDirectIssue();
