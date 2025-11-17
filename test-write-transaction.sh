#!/bin/bash

echo "🔧 Testando transação de escrita na blockchain"
echo ""
echo "📝 Registrando um imóvel de teste..."
echo ""

# Registrar imóvel de teste
curl -s -X POST http://localhost:3000/api/properties/register \
  -H "Content-Type: application/json" \
  -d '{
    "matriculaId": "123456",
    "folha": "100",
    "comarca": "São Paulo - SP",
    "endereco": "Rua Teste, 123 - Bairro Exemplo",
    "metragem": "150",
    "proprietario": "0x565524f400856766f11562832eB809d889491a01",
    "matriculaOrigem": "0",
    "tipo": 0,
    "isRegular": true
  }' | jq .

echo ""
echo "⏳ Aguardando confirmação na blockchain..."
sleep 3

echo ""
echo "📊 Consultando imóvel registrado..."
curl -s http://localhost:3000/api/properties/123456 | jq .

echo ""
echo "✅ Teste de transação de escrita concluído!"
