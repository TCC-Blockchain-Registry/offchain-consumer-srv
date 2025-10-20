#!/bin/bash

# ============================================================================
# EXEMPLOS PRÁTICOS - Besu Property Ledger API
# ============================================================================
# 
# Este script contém exemplos completos de como usar a API para:
# 1. Registrar aprovadores
# 2. Registrar imóvel
# 3. Transferir imóvel
#
# IMPORTANTE: Ajuste os endereços e chaves conforme seu ambiente!
# ============================================================================

API_URL="http://localhost:3000"

echo "🏠 Besu Property Ledger - Exemplos Práticos"
echo "============================================"
echo ""

# ============================================================================
# CORES PARA OUTPUT
# ============================================================================
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================================================
# FUNÇÃO AUXILIAR
# ============================================================================
print_section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# ============================================================================
# SETUP: ENDEREÇOS E CHAVES
# ============================================================================
print_section "📝 SETUP - Configurações"

# IMPORTANTE: Substitua por seus endereços e chaves reais!
CARTORIO_ADDRESS="0x1234567890123456789012345678901234567890"
CARTORIO_KEY="0xYourCartorioPrivateKey"

PREFEITURA_ADDRESS="0x2345678901234567890123456789012345678901"
PREFEITURA_KEY="0xYourPrefeituraPrivateKey"

IF_ADDRESS="0x3456789012345678901234567890123456789012"
IF_KEY="0xYourIFPrivateKey"

ALICE_ADDRESS="0xAliceAddress"
ALICE_KEY="0xAlicePrivateKey"

BOB_ADDRESS="0xBobAddress"
BOB_KEY="0xBobPrivateKey"

MATRICULA_ID=123456

echo "Configurações:"
echo "  Cartório: $CARTORIO_ADDRESS"
echo "  Prefeitura: $PREFEITURA_ADDRESS"
echo "  IF: $IF_ADDRESS"
echo "  Alice (vendedor): $ALICE_ADDRESS"
echo "  Bob (comprador): $BOB_ADDRESS"
echo "  Matrícula: $MATRICULA_ID"
echo ""
echo -e "${YELLOW}⚠️  Ajuste os endereços e chaves acima antes de executar!${NC}"

read -p "Pressione ENTER para continuar..."

# ============================================================================
# 1. REGISTRAR APROVADORES
# ============================================================================
print_section "1️⃣  REGISTRAR APROVADORES"

echo -e "${GREEN}Registrando Cartório...${NC}"
curl -X POST "$API_URL/api/approvers/register" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "'$CARTORIO_ADDRESS'",
    "type": 0,
    "name": "Cartório 1º Ofício de São Paulo",
    "document": "12.345.678/0001-90"
  }' | jq .

echo ""
read -p "Pressione ENTER para registrar Prefeitura..."

echo -e "${GREEN}Registrando Prefeitura...${NC}"
curl -X POST "$API_URL/api/approvers/register" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "'$PREFEITURA_ADDRESS'",
    "type": 1,
    "name": "Prefeitura Municipal de São Paulo",
    "document": "98.765.432/0001-00"
  }' | jq .

echo ""
read -p "Pressione ENTER para registrar IF..."

echo -e "${GREEN}Registrando Instituição Financeira...${NC}"
curl -X POST "$API_URL/api/approvers/register" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "'$IF_ADDRESS'",
    "type": 2,
    "name": "Banco do Brasil S.A.",
    "document": "11.222.333/0001-44"
  }' | jq .

echo ""
echo -e "${GREEN}✅ Aprovadores registrados!${NC}"

# ============================================================================
# 1.1. LISTAR APROVADORES
# ============================================================================
echo ""
read -p "Pressione ENTER para listar aprovadores..."

echo -e "${GREEN}Listando todos os aprovadores ativos...${NC}"
curl "$API_URL/api/approvers?activeOnly=true" | jq .

echo ""
read -p "Pressione ENTER para obter aprovadores recomendados..."

echo -e "${GREEN}Obtendo aprovadores recomendados...${NC}"
curl "$API_URL/api/approvers/recommended/list" | jq .

# ============================================================================
# 2. REGISTRAR IMÓVEL
# ============================================================================
print_section "2️⃣  REGISTRAR IMÓVEL"

echo -e "${GREEN}Registrando imóvel (matrícula $MATRICULA_ID) para Alice...${NC}"
curl -X POST "$API_URL/api/properties/register" \
  -H "Content-Type: application/json" \
  -d '{
    "matriculaId": '$MATRICULA_ID',
    "folha": 100,
    "comarca": "São Paulo",
    "endereco": "Rua Exemplo, 123 - Centro - São Paulo/SP",
    "metragem": 150,
    "proprietario": "'$ALICE_ADDRESS'",
    "matriculaOrigem": 0,
    "tipo": 0,
    "isRegular": true
  }' | jq .

echo ""
echo -e "${GREEN}✅ Imóvel registrado!${NC}"

# ============================================================================
# 2.1. CONSULTAR IMÓVEL
# ============================================================================
echo ""
read -p "Pressione ENTER para consultar o imóvel..."

echo -e "${GREEN}Consultando imóvel registrado...${NC}"
curl "$API_URL/api/properties/$MATRICULA_ID" | jq .

echo ""
read -p "Pressione ENTER para verificar o dono..."

echo -e "${GREEN}Verificando dono atual...${NC}"
curl "$API_URL/api/properties/$MATRICULA_ID/owner" | jq .

# ============================================================================
# 3. TRANSFERIR IMÓVEL (4 PASSOS)
# ============================================================================
print_section "3️⃣  TRANSFERIR IMÓVEL (Alice → Bob)"

echo "Vamos transferir a matrícula $MATRICULA_ID de Alice para Bob"
echo "Processo completo: 4 passos"
echo ""

# ============================================================================
# 3.1. CONFIGURAR TRANSFERÊNCIA
# ============================================================================
echo ""
read -p "Pressione ENTER para PASSO 1: Configurar transferência..."

echo -e "${GREEN}[PASSO 1] Configurando transferência...${NC}"
curl -X POST "$API_URL/api/transfers/configure" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "'$ALICE_ADDRESS'",
    "to": "'$BOB_ADDRESS'",
    "matriculaId": '$MATRICULA_ID',
    "approvers": [
      "'$CARTORIO_ADDRESS'",
      "'$PREFEITURA_ADDRESS'",
      "'$IF_ADDRESS'"
    ]
  }' | jq .

echo ""
echo -e "${GREEN}✅ Transferência configurada! Aprovadores necessários: 3${NC}"

# ============================================================================
# 3.2. APROVAÇÕES
# ============================================================================
echo ""
read -p "Pressione ENTER para PASSO 2: Aprovações..."

# Cartório aprova
echo -e "${GREEN}[PASSO 2.1] Cartório aprovando...${NC}"
curl -X POST "$API_URL/api/transfers/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "'$ALICE_ADDRESS'",
    "to": "'$BOB_ADDRESS'",
    "matriculaId": '$MATRICULA_ID',
    "approverPrivateKey": "'$CARTORIO_KEY'"
  }' | jq .

echo ""
read -p "Pressione ENTER para Prefeitura aprovar..."

# Prefeitura aprova
echo -e "${GREEN}[PASSO 2.2] Prefeitura aprovando...${NC}"
curl -X POST "$API_URL/api/transfers/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "'$ALICE_ADDRESS'",
    "to": "'$BOB_ADDRESS'",
    "matriculaId": '$MATRICULA_ID',
    "approverPrivateKey": "'$PREFEITURA_KEY'"
  }' | jq .

echo ""
read -p "Pressione ENTER para IF aprovar..."

# IF aprova
echo -e "${GREEN}[PASSO 2.3] IF aprovando...${NC}"
curl -X POST "$API_URL/api/transfers/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "'$ALICE_ADDRESS'",
    "to": "'$BOB_ADDRESS'",
    "matriculaId": '$MATRICULA_ID',
    "approverPrivateKey": "'$IF_KEY'"
  }' | jq .

echo ""
echo -e "${GREEN}✅ Todas as aprovações registradas! (3/3)${NC}"

# ============================================================================
# 3.3. VERIFICAR STATUS
# ============================================================================
echo ""
read -p "Pressione ENTER para verificar status da transferência..."

echo -e "${GREEN}Consultando detalhes da transferência...${NC}"
curl "$API_URL/api/transfers/details?from=$ALICE_ADDRESS&to=$BOB_ADDRESS&matriculaId=$MATRICULA_ID" | jq .

# ============================================================================
# 3.4. COMPRADOR ACEITA
# ============================================================================
echo ""
read -p "Pressione ENTER para PASSO 3: Bob aceitar..."

echo -e "${GREEN}[PASSO 3] Bob aceitando transferência...${NC}"
curl -X POST "$API_URL/api/transfers/accept" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "'$ALICE_ADDRESS'",
    "matriculaId": '$MATRICULA_ID',
    "buyerPrivateKey": "'$BOB_KEY'"
  }' | jq .

echo ""
echo -e "${GREEN}✅ Bob aceitou a transferência!${NC}"

# ============================================================================
# 3.5. EXECUTAR TRANSFERÊNCIA
# ============================================================================
echo ""
read -p "Pressione ENTER para PASSO 4 (FINAL): Alice executar transferência..."

echo -e "${GREEN}[PASSO 4] Alice executando transferência...${NC}"
curl -X POST "$API_URL/api/transfers/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "'$BOB_ADDRESS'",
    "matriculaId": '$MATRICULA_ID',
    "sellerPrivateKey": "'$ALICE_KEY'"
  }' | jq .

echo ""
echo -e "${GREEN}🎉 TRANSFERÊNCIA CONCLUÍDA COM SUCESSO!${NC}"

# ============================================================================
# 4. VERIFICAR RESULTADO
# ============================================================================
print_section "4️⃣  VERIFICAR RESULTADO"

echo -e "${GREEN}Verificando novo dono...${NC}"
curl "$API_URL/api/properties/$MATRICULA_ID/owner" | jq .

echo ""
echo -e "${GREEN}Verificando propriedades de Bob...${NC}"
curl "$API_URL/api/properties/owner/$BOB_ADDRESS" | jq .

# ============================================================================
# FIM
# ============================================================================
print_section "✅ PROCESSO COMPLETO!"

echo "Resumo:"
echo "  ✅ 3 aprovadores registrados (Cartório, Prefeitura, IF)"
echo "  ✅ Imóvel registrado (matrícula $MATRICULA_ID)"
echo "  ✅ Transferência configurada"
echo "  ✅ 3 aprovações registradas"
echo "  ✅ Comprador aceitou"
echo "  ✅ Transferência executada"
echo "  ✅ Bob agora é o proprietário!"
echo ""
echo -e "${BLUE}🎉 Sucesso! Imóvel transferido de Alice para Bob on-chain!${NC}"
echo ""

