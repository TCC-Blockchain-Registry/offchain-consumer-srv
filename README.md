# Offchain Consumer Service

REST API and event listener for blockchain integration in the property tokenization platform.

## Overview

The Offchain Consumer Service is the blockchain integration layer that bridges off-chain services with on-chain smart contracts. It provides a REST API for blockchain operations and an event listener that monitors blockchain events and sends webhooks to the orchestrator for real-time synchronization.

This service uses Ethers.js v6 to interact with Hyperledger Besu nodes running ERC-3643 security token contracts.

## Tech Stack

- **Node.js 18+** - Runtime environment
- **TypeScript** - Programming language
- **Express** - Web framework
- **Ethers.js v6** - Ethereum/Besu integration library
- **Axios** - HTTP client for webhooks
- **dotenv** - Environment configuration

## Prerequisites

- Node.js 18+
- npm or yarn
- Hyperledger Besu network running (localhost:8545)
- Deployed smart contracts with addresses
- jq (for ABI extraction)

## Quick Start

```bash
# Clone repository
git clone <repository-url>
cd offchain-consumer-srv

# Install dependencies
npm install

# Copy environment template
cp env.template .env
# Edit .env with deployed contract addresses (see Environment Variables section)

# Extract ABIs from Foundry build artifacts
# (Assumes besu-property-ledger is in parent directory)
cd ../besu-property-ledger
cat out/PropertyTitleTREX.sol/PropertyTitleTREX.json | jq '.abi' > ../offchain-consumer-srv/src/abis/PropertyTitleTREX.json
cat out/ApprovalsModule.sol/ApprovalsModule.json | jq '.abi' > ../offchain-consumer-srv/src/abis/ApprovalsModule.json
cat out/RegistryMDCompliance.sol/RegistryMDCompliance.json | jq '.abi' > ../offchain-consumer-srv/src/abis/RegistryMDCompliance.json
cd ../offchain-consumer-srv

# Run API server (development mode)
npm run dev

# In a separate terminal, run event listener
npm run listen:dev
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

## Running Standalone

```bash
# Development mode (API server)
npm run dev

# Development mode (Event listener)
npm run listen:dev

# Production build
npm run build
npm start

# Production event listener
npm run listen
```

## Environment Variables

The service requires extensive configuration via `env.template`:

### Blockchain Connection

```env
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=1337
```

### Private Keys (Development Only)

```env
ADMIN_PRIVATE_KEY=0x...     # AGENT_ROLE + DEFAULT_ADMIN_ROLE
ORCHESTRATOR_PRIVATE_KEY=0x...  # ORCHESTRATOR_ROLE
REGISTRAR_PRIVATE_KEY=0x...     # REGISTRAR_ROLE
```

**WARNING**: Never commit private keys to version control. Use environment variable injection in production.

### Contract Addresses

```env
PROPERTY_TITLE_ADDRESS=0x...
APPROVALS_MODULE_ADDRESS=0x...
REGISTRY_MODULE_ADDRESS=0x...
APPROVERS_REGISTRY_ADDRESS=0x...
IDENTITY_REGISTRY_ADDRESS=0x...
MODULAR_COMPLIANCE_ADDRESS=0x...
```

These addresses are obtained from `deployed-addresses.txt` after running contract deployment in besu-property-ledger.

### Webhook Configuration (Optional)

```env
WEBHOOK_URL=https://api.orchestrator.com/webhook
WEBHOOK_API_KEY=your-api-key-here
```

## Integration with Other Services

The Offchain Consumer integrates with:

1. **Hyperledger Besu** (port 8545) - Blockchain network via JSON-RPC
2. **Queue Worker** - Receives job requests via HTTP
3. **Core Orchestrator** - Sends event webhooks for synchronization

**Architecture**:
```
Queue Worker → HTTP → Offchain API → JSON-RPC → Blockchain
                                   ↓ Events
                          Webhook → Orchestrator
```

## API Endpoints

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

## Event Listener

The event listener is a separate process that monitors blockchain events and sends webhooks:

### Monitored Events

| Event | Contract | Description |
|-------|----------|-------------|
| `PROPERTY_ISSUED` | PropertyTitleTREX | New property token minted |
| `PROPERTY_TRANSFERRED` | PropertyTitleTREX | Ownership transferred |
| `PROPERTY_REGISTERED` | RegistryMDCompliance | Property metadata registered |
| `TRANSFER_CONFIGURED` | ApprovalsModule | Transfer initiated with approvers |
| `TRANSFER_APPROVED` | ApprovalsModule | Approver gave approval |
| `BUYER_ACCEPTED` | ApprovalsModule | Buyer accepted transfer |
| `APPROVER_REGISTERED` | ApproversRegistry | New approver entity registered |

### Webhook Payload Example

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

## Health Check

```bash
# API health
curl http://localhost:3000/health

# Check blockchain connection
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "blockchain": "connected",
  "contracts": "loaded"
}
```

## Troubleshooting

### Cannot Connect to Blockchain

**Problem**: `Error connecting to RPC`

**Solution**:
- Verify Besu network is running: `docker ps | grep besu`
- Check RPC URL in `.env` matches Besu configuration
- Test connection: `curl http://localhost:8545 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`

### Contract Addresses Not Found

**Problem**: `Contract address is undefined`

**Solution**:
1. Deploy contracts in besu-property-ledger
2. Copy addresses from `deployed-addresses.txt`
3. Update `.env` with correct addresses
4. Restart service

### ABIs Not Found

**Problem**: `Cannot find module './abis/PropertyTitleTREX.json'`

**Solution**:
```bash
cd ../besu-property-ledger
cat out/PropertyTitleTREX.sol/PropertyTitleTREX.json | jq '.abi' > ../offchain-consumer-srv/src/abis/PropertyTitleTREX.json
cat out/ApprovalsModule.sol/ApprovalsModule.json | jq '.abi' > ../offchain-consumer-srv/src/abis/ApprovalsModule.json
cat out/RegistryMDCompliance.sol/RegistryMDCompliance.json | jq '.abi' > ../offchain-consumer-srv/src/abis/RegistryMDCompliance.json
```

### Transaction Reverted

**Problem**: `Transaction reverted without a reason`

**Solution**:
- Check wallet has ETH for gas (even though gas price is 0)
- Verify wallet has required role for operation
- Check contract is not paused
- Verify transfer is properly configured before execution

### Webhook Failures

**Problem**: Event listener shows webhook errors

**Solution**:
- Verify orchestrator is running and accessible
- Check `WEBHOOK_URL` in `.env` is correct
- Verify `WEBHOOK_API_KEY` if authentication is required
- Check orchestrator logs for webhook endpoint errors

## License

MIT
