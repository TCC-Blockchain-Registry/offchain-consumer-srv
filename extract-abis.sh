#!/bin/bash

# Script para extrair ABIs dos contratos compilados
# Rode este script da raiz do projeto

echo "🔧 Extraindo ABIs dos contratos..."

# Criar diretório de ABIs se não existir
mkdir -p backend-example/src/abis

# Verificar se os contratos foram compilados
if [ ! -d "out" ]; then
  echo "❌ Diretório 'out/' não encontrado. Execute 'forge build' primeiro."
  exit 1
fi

# Extrair ABIs
echo "📝 Extraindo PropertyTitleTREX..."
cat out/PropertyTitleTREX.sol/PropertyTitleTREX.json | jq '.abi' > backend-example/src/abis/PropertyTitleTREX.json

echo "📝 Extraindo ApprovalsModule..."
cat out/ApprovalsModule.sol/ApprovalsModule.json | jq '.abi' > backend-example/src/abis/ApprovalsModule.json

echo "📝 Extraindo RegistryMDCompliance..."
cat out/RegistryMDCompliance.sol/RegistryMDCompliance.json | jq '.abi' > backend-example/src/abis/RegistryMDCompliance.json

echo "✅ ABIs extraídos com sucesso!"
echo ""
echo "📋 Arquivos criados:"
ls -lh backend-example/src/abis/

echo ""
echo "🎯 Próximo passo: Configure o arquivo .env com os endereços dos contratos"
echo "   Veja: deployed-addresses.txt"

