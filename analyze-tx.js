const { ethers } = require('ethers');

class LegacyProvider extends ethers.JsonRpcProvider {
  async getFeeData() { return new ethers.FeeData(ethers.toBigInt(1000), null, null); }
  async resolveName(name) { return null; }
}

async function analyzeTx() {
  const provider = new LegacyProvider('http://127.0.0.1:8545', { chainId: 1337, name: 'besu-private' });
  
  // Hash da última transação que falhou
  const txHash = '0x3ec6a4fabfbfb1394639d3787086cba6cc56ab8fd33d5e56b1a6c4a887a74b69';
  
  console.log(`🔍 Analisando TX: ${txHash}`);
  
  const receipt = await provider.getTransactionReceipt(txHash);
  const tx = await provider.getTransaction(txHash);
  
  console.log('\n📋 Informações da TX:');
  console.log(`   From: ${tx.from}`);
  console.log(`   To: ${tx.to}`);
  console.log(`   Gas Limit: ${tx.gasLimit}`);
  console.log(`   Gas Used: ${receipt.gasUsed}`);
  console.log(`   Status: ${receipt.status} (0 = FAIL, 1 = SUCCESS)`);
  console.log(`   Data: ${tx.data.substring(0, 100)}...`);
  
  // Tentar debug
  console.log('\n🔍 Tentando obter razão do revert...');
  try {
    await provider.call(tx, tx.blockNumber);
  } catch (error) {
    if (error.data) {
      console.log(`   Revert reason data: ${error.data}`);
    }
    console.log(`   Error: ${error.message}`);
  }
}

analyzeTx().catch(console.error);
