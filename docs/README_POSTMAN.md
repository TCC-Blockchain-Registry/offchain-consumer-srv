# 📮 Postman Collection - Besu Property Ledger API

Guia completo para importar e usar a collection do Postman.

---

## 📦 Arquivos da Collection

- `Besu_Property_Ledger_API.postman_collection.json` - Collection completa com todos os endpoints
- `Besu_Property_Ledger.postman_environment.json` - Environment com variáveis pré-configuradas

---

## 🚀 Como Importar

### 1. Importar a Collection

1. Abra o Postman
2. Clique em **Import** (canto superior esquerdo)
3. Arraste o arquivo `Besu_Property_Ledger_API.postman_collection.json` ou clique em **Upload Files**
4. Clique em **Import**

### 2. Importar o Environment

1. No Postman, clique em **Environments** (menu lateral esquerdo)
2. Clique em **Import**
3. Arraste o arquivo `Besu_Property_Ledger.postman_environment.json`
4. Clique em **Import**

### 3. Ativar o Environment

1. No canto superior direito, clique no dropdown de ambientes
2. Selecione **"Besu Property Ledger - Local"**
3. ✅ Pronto! As variáveis já estão configuradas

---

## ⚙️ Configurar Variáveis

Antes de testar, você precisa configurar as variáveis dos aprovadores:

### Variáveis que precisam ser atualizadas:

```
cartorioWallet          → Endereço da carteira do cartório
cartorioPrivateKey      → Chave privada do cartório

prefeituraWallet        → Endereço da carteira da prefeitura
prefeituraPrivateKey    → Chave privada da prefeitura

ifWallet                → Endereço da carteira da IF
ifPrivateKey            → Chave privada da IF

buyerWallet             → Endereço da carteira do comprador
buyerPrivateKey         → Chave privada do comprador
```

### Como editar as variáveis:

1. Clique em **Environments** no menu lateral
2. Selecione **"Besu Property Ledger - Local"**
3. Preencha os valores em branco
4. Clique em **Save**

---

## 📚 Estrutura da Collection

### 🏥 1. Health & Info
- `GET /health` - Verifica se API está online
- `GET /` - Documentação completa da API

### 👥 2. Approvers (Aprovadores)
- `POST /api/approvers/register` - Registrar aprovadores (3 exemplos prontos)
- `GET /api/approvers` - Listar todos os aprovadores
- `GET /api/approvers/recommended/list` - **⭐ IMPORTANTE:** Use este para obter lista de aprovadores!
- `GET /api/approvers/:wallet` - Detalhes de um aprovador
- `GET /api/approvers/validate/:wallet` - Validar aprovador
- `POST /api/approvers/validate-list` - Validar lista de aprovadores
- `POST /api/approvers/:wallet/deactivate` - Desativar aprovador
- `POST /api/approvers/:wallet/reactivate` - Reativar aprovador

### 🏠 3. Properties (Propriedades)
- `POST /api/properties/register` - Registrar imóvel
- `GET /api/properties/:matriculaId` - Detalhes completos do imóvel
- `GET /api/properties/compliance/:matriculaId` - Dados de compliance
- `GET /api/properties/owner/:wallet` - Listar imóveis de um dono
- `GET /api/properties/:matriculaId/owner` - Quem é o dono
- `GET /api/properties/:matriculaId/exists` - Verifica existência
- `GET /api/properties/:matriculaId/frozen` - Verifica se está congelado
- `PUT /api/properties/:matriculaId` - Atualizar dados cadastrais

### 🔄 4. Transfers (Transferências)
**Fluxo em 4 passos:**

1. **Configure**
   - `POST /api/transfers/configure` - Inicia a transferência

2. **Approve** (3x - um para cada aprovador)
   - `POST /api/transfers/approve` - Cartório aprova
   - `POST /api/transfers/approve` - Prefeitura aprova
   - `POST /api/transfers/approve` - IF aprova

3. **Accept**
   - `POST /api/transfers/accept` - Comprador aceita

4. **Execute**
   - `POST /api/transfers/execute` - Vendedor executa

**Consultas:**
- `GET /api/transfers/status` - Status básico
- `GET /api/transfers/details` - Status detalhado (quem aprovou, quem falta, próximo passo)
- `GET /api/transfers/has-approved` - Verifica se aprovador já aprovou

---

## 🎯 Fluxo Completo de Teste

### Passo 0: Preparar o Ambiente

```bash
# Certifique-se que a blockchain está rodando
cd docker/besu
docker-compose up -d

# Deploy dos contratos (se ainda não fez)
cd ../..
./scripts/setup/deploy-contracts.sh

# Iniciar a API
cd backend-example
npm run dev
```

### Passo 1: Registrar Aprovadores

Execute as 3 requests em **Approvers**:
1. ✅ Register Cartório
2. ✅ Register Prefeitura  
3. ✅ Register IF

**💡 Dica:** Copie os `wallet` addresses retornados e cole nas variáveis do Environment!

### Passo 2: Obter Lista de Aprovadores Recomendados

Execute:
```
GET /api/approvers/recommended/list
```

Você receberá:
```json
{
  "success": true,
  "data": {
    "approverAddresses": [
      "0xCARTORIO...",
      "0xPREFEITURA...",
      "0xIF..."
    ],
    "approvers": [...]
  }
}
```

**💡 Copie este array `approverAddresses`! Você vai precisar no próximo passo.**

### Passo 3: Registrar um Imóvel

Execute:
```
POST /api/properties/register
```

Body já está preenchido. Ajuste se necessário.

### Passo 4: Configurar Transferência

Execute:
```
POST /api/transfers/configure
```

**IMPORTANTE:** Cole o array `approverAddresses` do Passo 2 no campo `"approvers"` do body!

### Passo 5: Aprovar (3x)

Execute cada request de aprovação:
1. ✅ 2. Approve - Cartório
2. ✅ 2. Approve - Prefeitura
3. ✅ 2. Approve - IF

**⚠️ Certifique-se de usar as private keys corretas de cada aprovador!**

### Passo 6: Comprador Aceita

Execute:
```
POST /api/transfers/accept
```

### Passo 7: Consultar Status Detalhado

Execute:
```
GET /api/transfers/details
```

Você verá:
- ✅ Quem já aprovou
- ✅ Se comprador aceitou
- ✅ Se está pronta para executar
- 📋 Próximo passo

### Passo 8: Executar Transferência

Execute:
```
POST /api/transfers/execute
```

🎉 **Transferência completa!**

### Passo 9: Verificar Novo Dono

Execute:
```
GET /api/properties/123456/owner
```

Deve retornar o novo endereço do comprador!

---

## 💡 Dicas Úteis

### 1. Usar Variáveis do Environment

Nos bodies das requests, você pode usar variáveis assim:

```json
{
  "sellerPrivateKey": "{{adminPrivateKey}}",
  "buyerPrivateKey": "{{buyerPrivateKey}}",
  "to": "{{buyerWallet}}"
}
```

### 2. Salvar Respostas em Variáveis

Você pode usar **Tests** do Postman para salvar valores automaticamente:

```javascript
// Na aba "Tests" de uma request
const response = pm.response.json();

// Salvar matriculaId
pm.environment.set("matriculaId", response.data.matriculaId);

// Salvar wallet de aprovador
pm.environment.set("cartorioWallet", response.data.wallet);
```

### 3. Consultar Status Durante o Fluxo

A qualquer momento, execute:
```
GET /api/transfers/details
```

Ele mostra:
- ✅ O que já foi feito
- ⏳ O que falta fazer
- 🚀 Qual o próximo passo

### 4. Filtrar Aprovadores por Tipo

```
GET /api/approvers?type=0  ← Apenas Cartórios
GET /api/approvers?type=1  ← Apenas Prefeituras
GET /api/approvers?type=2  ← Apenas IFs
```

### 5. Listar Apenas Aprovadores Ativos

```
GET /api/approvers?activeOnly=true
```

---

## ⚠️ Troubleshooting

### Erro: "Contract addresses not configured"
- ✅ Verifique se fez o deploy dos contratos
- ✅ Atualize o `.env` com os endereços corretos

### Erro: "Approver not registered"
- ✅ Execute as 3 requests de registro de aprovadores primeiro
- ✅ Verifique se usou os wallets corretos no `configure`

### Erro: "Not all approvers approved yet"
- ✅ Execute as 3 aprovações (Cartório, Prefeitura, IF)
- ✅ Consulte `GET /api/transfers/details` para ver quem falta

### Erro: "Buyer has not accepted yet"
- ✅ Execute `POST /api/transfers/accept` com a chave do comprador

### API não responde
```bash
# Verifique se está rodando
npm run dev

# Verifique a porta
curl http://localhost:3000/health
```

### Blockchain não responde
```bash
# Verifique os containers
cd docker/besu
docker-compose ps

# Restart se necessário
docker-compose restart
```

---

## 📖 Recursos Adicionais

- [Documentação Completa da API](./README_API.md)
- [Guia de Uso Detalhado](./GUIA_DE_USO.md)
- [Fluxo Completo Explicado](./FLUXO_COMPLETO.md)
- [Resumo do Sistema de Approvals](./RESUMO_APPROVALS.md)

---

## 🎓 Próximos Passos

Depois de testar com o Postman, você pode:

1. **Criar um Frontend**: Use os mesmos endpoints para construir uma interface web
2. **Automatizar Testes**: Use Newman (CLI do Postman) para testes automatizados
3. **Adicionar Mais Funcionalidades**: Extend a API com novos endpoints
4. **Integrar Eventos**: Adicione listeners para eventos da blockchain

---

## 📝 Notas Importantes

- 🔐 **NUNCA** commite private keys reais no Git!
- 🚀 As private keys no environment são apenas para desenvolvimento local
- 📊 Em produção, use variáveis de ambiente ou cofres de segredos
- 🔄 Sempre consulte `GET /api/transfers/details` para acompanhar o progresso
- ✅ Use `GET /api/approvers/recommended/list` para obter lista válida de aprovadores

---

**Bons testes! 🚀**

