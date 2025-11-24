# Offchain Consumer Service

API REST para integração com os smart contracts ERC-3643 (T-REX) do sistema de tokenização de imóveis.

## 📋 Visão Geral

Este serviço atua como camada de integração entre o backend (Orchestrator) e a blockchain Hyperledger Besu, executando transações e consultando dados dos contratos inteligentes.

### Arquitetura V2 (Atual)

O sistema utiliza **aprovação integrada** diretamente nos smart contracts:

```
Orchestrator → RabbitMQ → Queue Worker → Offchain Consumer → Blockchain
                                             ↑
                                             │
Orchestrator ← Webhook ← Event Listener ──────┘
```

**Características:**
- ✅ Aprovações integradas no `PropertyTitleTREX.sol`
- ✅ Sistema baseado em `requestHash` (identificador único)
- ✅ Execução **automática** quando todas as 3 aprovações são recebidas
- ✅ Não requer chamada manual de `execute()`

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- Blockchain Besu rodando (porta 8545)
- Contratos deployados

### Instalação

```bash
npm install
```

### Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
# Blockchain RPC
RPC_URL=http://localhost:8545
CHAIN_ID=1337

# Wallets (Private Keys)
ADMIN_PRIVATE_KEY=0x...
ORCHESTRATOR_PRIVATE_KEY=0x...
REGISTRAR_PRIVATE_KEY=0x...

# Endereços dos Contratos
PROPERTY_TITLE_ADDRESS=0x...
REGISTRY_MODULE_ADDRESS=0x...
IDENTITY_REGISTRY_ADDRESS=0x...
MODULAR_COMPLIANCE_ADDRESS=0x...

# API Config
PORT=3000
NODE_ENV=development
```

### Execução

```bash
# Desenvolvimento (hot reload)
npm run dev

# Produção
npm start

# Event Listener (monitoramento de eventos)
node event-listener.js
```

## 📚 Documentação da API

### Health Check

#### GET /health

Verifica se o serviço está operacional.

**Resposta:**
```json
{
  "status": "OK",
  "timestamp": "2025-11-22T10:30:00.000Z",
  "service": "Besu Property Ledger API"
}
```

---

## 🏠 Propriedades (`/api/properties`)

### 1. Registrar Propriedade

#### POST /api/properties/register

Cria uma solicitação de registro de propriedade que ficará pendente até receber as 3 aprovações.

**Request Body:**
```json
{
  "matriculaId": 999001,
  "folha": 123,
  "comarca": "São Paulo - SP",
  "endereco": "Rua Teste, 123",
  "metragem": 250,
  "proprietario": "0x1234...abcd",
  "matriculaOrigem": 999000,
  "tipo": 0,
  "isRegular": true
}
```

**Campos:**
- `matriculaId` (number, obrigatório): ID único da matrícula
- `folha` (number): Número da folha do cartório
- `comarca` (string, obrigatório): Nome da comarca
- `endereco` (string, obrigatório): Endereço do imóvel
- `metragem` (number): Área em m²
- `proprietario` (string, obrigatório): Endereço Ethereum do proprietário
- `matriculaOrigem` (number): Matrícula de origem (se desmembramento)
- `tipo` (number): 0=URBANO, 1=RURAL, 2=LITORAL
- `isRegular` (boolean): Status de regularidade

**Resposta (201 Created):**
```json
{
  "success": true,
  "message": "Solicitação de registro criada com sucesso. Aguardando aprovações.",
  "data": {
    "requestHash": "0xabc123...",
    "txHash": "0xdef456...",
    "blockNumber": 1234,
    "matriculaId": 999001,
    "beneficiary": "0x1234...abcd",
    "status": "PENDING_APPROVALS",
    "nextSteps": [
      "Aprovação Financial (Instituição Financeira)",
      "Aprovação Registry Office (Cartório)",
      "Aprovação Municipality (Prefeitura)",
      "Execução automática após todas as aprovações"
    ]
  }
}
```

### 2. Buscar Propriedade por ID

#### GET /api/properties/:matriculaId

Retorna informações completas de uma propriedade (compliance + blockchain).

**Resposta:**
```json
{
  "success": true,
  "data": {
    "matriculaId": 999001,
    "folha": 123,
    "comarca": "São Paulo - SP",
    "endereco": "Rua Teste, 123",
    "metragem": 250,
    "proprietario": "0x1234...abcd",
    "matriculaOrigem": 999000,
    "tipo": 0,
    "isRegular": true,
    "currentOwner": "0x1234...abcd",
    "exists": true,
    "typeName": "URBANO"
  }
}
```

### 3. Buscar Dados do Compliance

#### GET /api/properties/compliance/:matriculaId

Retorna apenas os dados armazenados no módulo de compliance (RegistryMDCompliance).

**Resposta:**
```json
{
  "success": true,
  "data": {
    "matriculaId": 999001,
    "folha": 123,
    "comarca": "São Paulo - SP",
    "endereco": "Rua Teste, 123",
    "metragem": 250,
    "proprietario": "0x1234...abcd",
    "matriculaOrigem": 999000,
    "tipo": 0,
    "isRegular": true,
    "typeName": "URBANO"
  }
}
```

### 4. Listar Propriedades de um Dono

#### GET /api/properties/owner/:address

Retorna todas as propriedades pertencentes a um endereço.

**Resposta:**
```json
{
  "success": true,
  "owner": "0x1234...abcd",
  "count": 2,
  "matriculas": [999001, 999002],
  "properties": [...]
}
```

### 5. Contar Propriedades

#### GET /api/properties/count/:address

Retorna a quantidade de propriedades de um endereço.

**Resposta:**
```json
{
  "success": true,
  "owner": "0x1234...abcd",
  "propertyCount": 2
}
```

### 6. Verificar Dono de Propriedade

#### GET /api/properties/:matriculaId/owner

Retorna o endereço do dono atual da propriedade.

**Resposta:**
```json
{
  "success": true,
  "matriculaId": 999001,
  "owner": "0x1234...abcd"
}
```

### 7. Verificar Existência

#### GET /api/properties/:matriculaId/exists

Verifica se uma propriedade existe no blockchain.

**Resposta:**
```json
{
  "success": true,
  "matriculaId": 999001,
  "exists": true
}
```

### 8. Atualizar Dados Cadastrais

#### PUT /api/properties/:matriculaId

Atualiza informações cadastrais de uma propriedade no compliance.

**Request Body:**
```json
{
  "endereco": "Novo Endereço, 456",
  "metragem": 300,
  "isRegular": true
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Propriedade atualizada",
  "matriculaId": 999001,
  "txHash": "0xabc123..."
}
```

---

## ✅ Aprovações V2 (`/api/approvals`)

### 1. Consultar Status de Registro

#### GET /api/approvals/registration/:requestHash/status

Verifica o status de uma solicitação de registro pendente.

**Resposta:**
```json
{
  "success": true,
  "status": {
    "exists": true,
    "matricula": 999001,
    "beneficiary": "0x1234...abcd",
    "financialApproved": true,
    "registryOfficeApproved": false,
    "municipalityApproved": false,
    "executed": false
  }
}
```

### 2. Aprovar como Instituição Financeira

#### POST /api/approvals/registration/:requestHash/approve-financial

Aprova uma solicitação de registro como Instituição Financeira.

**Resposta:**
```json
{
  "success": true,
  "message": "Aprovação registrada como Instituição Financeira",
  "txHash": "0xabc123...",
  "note": "Aguardando aprovações restantes (Registry Office, Municipality)"
}
```

### 3. Aprovar como Cartório

#### POST /api/approvals/registration/:requestHash/approve-registry

Aprova uma solicitação de registro como Cartório (Registry Office).

**Resposta:**
```json
{
  "success": true,
  "message": "Aprovação registrada como Cartório",
  "txHash": "0xdef456...",
  "note": "Aguardando aprovações restantes (Municipality)"
}
```

### 4. Aprovar como Prefeitura (AUTO-EXECUTA)

#### POST /api/approvals/registration/:requestHash/approve-municipality

Aprova uma solicitação de registro como Prefeitura. **ATENÇÃO:** Esta é a 3ª e última aprovação, que **executa automaticamente** o registro.

**Resposta:**
```json
{
  "success": true,
  "message": "⚡ APROVAÇÃO FINAL! Registro EXECUTADO automaticamente",
  "txHash": "0x789abc...",
  "note": "O token foi emitido e a propriedade está registrada on-chain!"
}
```

### 5. Solicitar Transferência

#### POST /api/approvals/transfer/request

Cria uma solicitação de transferência de propriedade.

**Request Body:**
```json
{
  "from": "0x1234...aaaa",
  "to": "0x5678...bbbb",
  "matriculaId": 999001
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Transferência solicitada",
  "requestHash": "0xbbb222...",
  "txHash": "0xccc333...",
  "blockNumber": 2345
}
```

### 6. Aprovar Transferência (Instituição Financeira)

#### POST /api/approvals/transfer/:requestHash/approve-financial

Aprova uma transferência como Instituição Financeira.

### 7. Aprovar Transferência (Cartório)

#### POST /api/approvals/transfer/:requestHash/approve-registry

Aprova uma transferência como Cartório.

### 8. Aprovar Transferência (Prefeitura - AUTO-EXECUTA)

#### POST /api/approvals/transfer/:requestHash/approve-municipality

Aprova uma transferência como Prefeitura. **Esta é a aprovação final que executa automaticamente a transferência.**

### 9. Consultar Status de Transferência

#### GET /api/approvals/transfer/:requestHash/status

Verifica o status de uma transferência pendente.

**Resposta:**
```json
{
  "success": true,
  "status": {
    "exists": true,
    "matricula": 999001,
    "from": "0x1234...aaaa",
    "to": "0x5678...bbbb",
    "financialApproved": true,
    "registryOfficeApproved": true,
    "municipalityApproved": false,
    "executed": false
  }
}
```

---

## 👤 Identidade (`/api/identity`)

### 1. Registrar Identidade

#### POST /api/identity/register

Registra uma identidade no `IdentityRegistry`.

**Request Body:**
```json
{
  "walletAddress": "0x1234...abcd",
  "country": 76
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Identidade registrada",
  "walletAddress": "0x1234...abcd",
  "country": 76,
  "txHash": "0xabc123..."
}
```

### 2. Verificar Identidade

#### GET /api/identity/:walletAddress/verify

Verifica se um endereço tem identidade registrada.

**Resposta:**
```json
{
  "success": true,
  "walletAddress": "0x1234...abcd",
  "isVerified": true
}
```

---

## 📊 Informações (`/api/info`)

### 1. Listar Propriedades de Endereço

#### GET /api/info/properties/:address

Retorna matrículas das propriedades de um endereço.

**Resposta:**
```json
{
  "success": true,
  "owner": "0x1234...abcd",
  "properties": [999001, 999002]
}
```

### 2. Contar Propriedades

#### GET /api/info/count/:address

Retorna contagem de propriedades.

**Resposta:**
```json
{
  "success": true,
  "owner": "0x1234...abcd",
  "count": 2
}
```

---

## 🔧 Sistema (`/api/system`)

Endpoints administrativos para gerenciamento do sistema (roles, pausas, etc.).

---

## 🎯 Fluxos Completos

### Fluxo de Registro de Propriedade

```
1. POST /api/properties/register
   ↓ (retorna requestHash)
2. POST /api/approvals/registration/{requestHash}/approve-financial
   ↓
3. POST /api/approvals/registration/{requestHash}/approve-registry
   ↓
4. POST /api/approvals/registration/{requestHash}/approve-municipality
   ↓ (EXECUTA AUTOMATICAMENTE)
✅ Propriedade registrada e tokens mintados!
```

### Fluxo de Transferência de Propriedade

```
1. POST /api/approvals/transfer/request
   ↓ (retorna requestHash)
2. POST /api/approvals/transfer/{requestHash}/approve-financial
   ↓
3. POST /api/approvals/transfer/{requestHash}/approve-registry
   ↓
4. POST /api/approvals/transfer/{requestHash}/approve-municipality
   ↓ (EXECUTA AUTOMATICAMENTE)
✅ Propriedade transferida!
```

---

## 🛠️ Utilitários

### Extrair ABIs dos Contratos

```bash
# Extrai ABIs dos contratos Foundry para src/abis/
./extract-abis.sh
```

### Testar Conexão com Blockchain

```bash
node test-connection.js
```

### Event Listener

O serviço de event listener monitora eventos do blockchain e envia webhooks para o Orchestrator:

```bash
node event-listener.js
```

**Eventos monitorados:**
- `PropertyRegistered`
- `PropertyTransferred`
- `Transfer` (ERC-20)
- `ApprovalRecorded`

---

## ⚙️ Tecnologias

- **Node.js 18+** - Runtime JavaScript
- **TypeScript 5.x** - Tipagem estática
- **Express.js 4.x** - Framework web
- **Ethers.js 6.x** - Biblioteca blockchain
- **Hyperledger Besu** - Cliente Ethereum enterprise

---

## 📝 Notas Importantes

### Execução Automática

⚡ **NÃO existem** endpoints `/execute` separados. A execução é **AUTOMÁTICA** quando a 3ª aprovação é recebida!

**Métodos removidos:**
- ❌ `executeRegistration()`
- ❌ `executeTransfer()`

### Métodos do Contrato

Os seguintes métodos **NÃO existem** no `PropertyTitleTREX.sol`:

❌ Removidos da API:
- `freezeProperty()` / `unfreezeProperty()`
- `batchFreezeProperties()`
- `forcedTransferProperty()`
- `isPropertyFrozen()`
- `isTransferPaused()`
- `mint()` / `burn()` manuais
- Sistema de validators separado

### Sistema V1 vs V2

**V1 (Obsoleto - Removido):**
- Contratos separados: `ApprovalsModule`, `ApproversRegistry`
- Sistema de validators com endereços
- Execução manual em 3 etapas

**V2 (Atual):**
- Aprovação integrada no `PropertyTitleTREX`
- Sistema baseado em roles (FINANCIAL_ROLE, REGISTRY_OFFICE_ROLE, MUNICIPALITY_ROLE)
- Execução automática em 2 etapas: request → approve (auto-executa)

---

## 📄 Licença

MIT
