# 🏠 Besu Property Ledger - API Backend

API REST para facilitar a integração com os smart contracts de tokenização de imóveis.

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
# Edite .env com os endereços dos contratos deployados
```

### 3. Extrair ABIs dos Contratos

```bash
# Da raiz do projeto (onde está out/)
cat out/PropertyTitleTREX.sol/PropertyTitleTREX.json | jq '.abi' > backend-example/src/abis/PropertyTitleTREX.json
cat out/ApprovalsModule.sol/ApprovalsModule.json | jq '.abi' > backend-example/src/abis/ApprovalsModule.json
cat out/RegistryMDCompliance.sol/RegistryMDCompliance.json | jq '.abi' > backend-example/src/abis/RegistryMDCompliance.json
```

### 4. Configurar Webhook (Opcional)

Adicione ao `.env`:

```bash
# Webhook do Orquestrador
WEBHOOK_URL=https://api.orquestrador.com/webhook
WEBHOOK_API_KEY=seu-api-key-aqui

# Endereço do ApproversRegistry
APPROVERS_REGISTRY_ADDRESS=0x...
```

### 5. Rodar Event Listener

```bash
# Event listener (escuta eventos da blockchain)
npm run listen

# OU com auto-reload
npm run listen:dev
```

### 6. Rodar API em Desenvolvimento

```bash
npm run dev
```

A API estará disponível em `http://localhost:3000`

---

## 🎧 Event Listener (NOVO!)

O **event listener** escuta eventos da blockchain e envia notificações para o webhook do orquestrador em tempo real.

### Eventos Monitorados

| Evento | Quando | Payload |
|--------|--------|---------|
| `PROPERTY_ISSUED` | Título emitido | `matricula`, `owner` |
| `PROPERTY_TRANSFERRED` | Transferência concluída | `matricula`, `from`, `to` |
| `PROPERTY_REGISTERED` | Cadastro registrado | `matricula`, `folha`, `comarca`, etc |
| `TRANSFER_CONFIGURED` | Transferência configurada | `from`, `to`, `matricula`, `requiredApprovers` |
| `TRANSFER_APPROVED` | Aprovação recebida | `transferHash`, `approver`, `progress` |
| `BUYER_ACCEPTED` | Comprador aceitou | `transferHash`, `buyer` |
| `APPROVER_REGISTERED` | Aprovador registrado | `wallet`, `type`, `name` |

### Exemplo de Payload do Webhook

```json
{
  "eventType": "PROPERTY_TRANSFERRED",
  "matricula": "123456",
  "from": "0x1234...",
  "to": "0x5678...",
  "transactionHash": "0xabcd...",
  "blockNumber": 12345,
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

### Como Funciona

```
Blockchain Events → Event Listener → Webhook Orquestrador
     (on-chain)         (backend)          (seu sistema)
```

📖 **[Documentação Completa de Eventos](../docs/backend/EVENTOS_WEBHOOK.md)**

---

## 📖 Documentação Completa

Veja [docs/backend/NODE_API_INTEGRATION.md](../docs/backend/NODE_API_INTEGRATION.md) para:
- Guia completo de setup
- Exemplos de código
- Todos os endpoints disponíveis
- Event listeners
- Próximos passos

## 🔗 Endpoints Principais

### Propriedades
- `POST /api/properties/register` - Registrar novo imóvel
- `GET /api/properties/:matriculaId` - Consultar imóvel
- `GET /api/properties/owner/:address` - Listar imóveis de um dono

### Transferências
- `POST /api/transfers/configure` - Configurar transferência
- `POST /api/transfers/approve` - Aprovar transferência
- `POST /api/transfers/accept` - Comprador aceitar
- `POST /api/transfers/execute` - Executar transferência
- `GET /api/transfers/status?from=X&to=Y` - Consultar status

### Admin
- `POST /api/admin/freeze-property` - Congelar/descongelar propriedade
- `POST /api/admin/batch-freeze` - Congelar múltiplas propriedades
- `POST /api/admin/pause-system` - Pausar sistema
- `POST /api/admin/forced-transfer` - Transferência forçada
- `GET /api/admin/property-frozen/:id` - Verificar se está congelada
- `GET /api/admin/system-paused` - Verificar se sistema está pausado

## 🧪 Testar com cURL

```bash
# Registrar imóvel
curl -X POST http://localhost:3000/api/properties/register \
  -H "Content-Type: application/json" \
  -d '{
    "matriculaId": 123456,
    "endereco": "Rua Exemplo, 123",
    "proprietario": "0x565524f400856766f11562832eb809d889491a01"
  }'

# Consultar imóvel
curl http://localhost:3000/api/properties/123456

# Health check
curl http://localhost:3000/health
```
