const { ethers } = require('ethers');
const ApprovalsModuleABI = require('./src/abis/ApprovalsModule.json');

const provider = new ethers.JsonRpcProvider('http://besu-validator1-1:8545');
const adminWallet = new ethers.Wallet('0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d', provider);

const APPROVALS_MODULE_ADDRESS = '0x94153ca9c35db4697ab0A62F3D4984E72A898A58';
const COMPLIANCE_ADDRESS = '0xe5cd4e5c2b5c700311278c6b9660b1478a4fa33c';

async function testConfigureTransfer() {
  try {
    console.log('🧪 Testando configureTransfer...');
    console.log(`Admin Wallet: ${adminWallet.address}`);
    
    const approvalsModule = new ethers.Contract(
      APPROVALS_MODULE_ADDRESS,
      ApprovalsModuleABI,
      adminWallet
    );
    
    // Verificar role
    const ORCHESTRATOR_ROLE = await approvalsModule.ORCHESTRATOR_ROLE();
    console.log(`ORCHESTRATOR_ROLE: ${ORCHESTRATOR_ROLE}`);
    
    const hasRole = await approvalsModule.hasRole(ORCHESTRATOR_ROLE, adminWallet.address);
    console.log(`Admin tem ORCHESTRATOR_ROLE? ${hasRole}`);
    
    if (!hasRole) {
      console.log('❌ Admin não tem ORCHESTRATOR_ROLE! Concedendo...');
      const grantTx = await approvalsModule.grantRole(ORCHESTRATOR_ROLE, adminWallet.address, {
        type: 0,
        gasLimit: 100000,
        gasPrice: 1000
      });
      await grantTx.wait();
      console.log('✅ ORCHESTRATOR_ROLE concedido!');
    }
    
    // Testar configureTransfer
    console.log('📝 Configurando transferência de teste...');
    const tx = await approvalsModule.configureTransfer(
      '0x3b59b80bef76afce7d0a0d19eeef73045a87816c', // from
      '0x1234567890123456789012345678901234567890', // to
      4545, // matriculaId
      COMPLIANCE_ADDRESS,
      [adminWallet.address], // approvers
      {
        type: 0,
        gasLimit: 400000,
        gasPrice: 1000
      }
    );
    
    console.log(`⏳ TX: ${tx.hash}`);
    const receipt = await tx.wait();
    
    console.log(`✅ Transferência configurada! Block: ${receipt.blockNumber}`);
    console.log(`Status: ${receipt.status}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.data) {
      console.error('Data:', error.data);
    }
  }
}

testConfigureTransfer();
