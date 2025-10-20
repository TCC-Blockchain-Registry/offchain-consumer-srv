#!/usr/bin/env node

// Script para extrair ABIs dos contratos compilados
const fs = require('fs');
const path = require('path');

console.log('🔧 Extraindo ABIs dos contratos...\n');

// Configuração
const outDir = path.join(__dirname, '..', 'out');
const abisDir = path.join(__dirname, 'src', 'abis');

// Contratos para extrair
const contracts = [
  {
    name: 'PropertyTitleTREX',
    path: 'PropertyTitleTREX.sol/PropertyTitleTREX.json'
  },
  {
    name: 'ApprovalsModule',
    path: 'ApprovalsModule.sol/ApprovalsModule.json'
  },
  {
    name: 'RegistryMDCompliance',
    path: 'RegistryMDCompliance.sol/RegistryMDCompliance.json'
  }
];

// Verificar se diretório out/ existe
if (!fs.existsSync(outDir)) {
  console.error('❌ Diretório "out/" não encontrado.');
  console.error('   Execute "forge build" na raiz do projeto primeiro.\n');
  process.exit(1);
}

// Criar diretório de ABIs se não existir
if (!fs.existsSync(abisDir)) {
  fs.mkdirSync(abisDir, { recursive: true });
}

// Extrair ABIs
let success = 0;
let failed = 0;

contracts.forEach(contract => {
  try {
    console.log(`📝 Extraindo ${contract.name}...`);
    
    const contractPath = path.join(outDir, contract.path);
    const outputPath = path.join(abisDir, `${contract.name}.json`);
    
    // Ler arquivo JSON
    const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    
    // Extrair apenas o ABI
    const abi = contractJson.abi;
    
    // Salvar ABI
    fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));
    
    console.log(`   ✅ Salvo em: ${outputPath}`);
    success++;
    
  } catch (error) {
    console.error(`   ❌ Erro ao extrair ${contract.name}:`, error.message);
    failed++;
  }
});

console.log('\n📊 Resumo:');
console.log(`   ✅ Sucesso: ${success}`);
console.log(`   ❌ Falhas: ${failed}\n`);

if (success > 0) {
  console.log('📋 Arquivos criados em backend-example/src/abis/:\n');
  const files = fs.readdirSync(abisDir);
  files.forEach(file => {
    const stats = fs.statSync(path.join(abisDir, file));
    console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  });
  
  console.log('\n🎯 Próximo passo:');
  console.log('   1. Copie .env.example para .env');
  console.log('   2. Configure os endereços dos contratos (veja deployed-addresses.txt)');
  console.log('   3. Execute: npm install');
  console.log('   4. Execute: npm run dev\n');
}

