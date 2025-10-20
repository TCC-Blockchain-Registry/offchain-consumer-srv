# 🔧 Fix: Gas Price Below Minimum

## Problema

Erro ao executar transações na rede Besu:
```
Gas price below configured minimum gas price
```

Mesmo com `--min-gas-price=0` configurado nos validadores, o Besu rejeita transações com `gasPrice: 0`.

---

## Solução Aplicada

### 1. Configuração Mínima no Backend

**Arquivo:** `backend-example/src/config/blockchain.ts`

```typescript
// Gas price = 1 wei (mínimo aceito pelo Besu)
export const defaultTxOptions = {
  gasPrice: 1,
  gasLimit: 10000000
};
```

### 2. Atualização de Todos os Services

Todos os métodos que fazem transações agora usam `gasPrice: 1`:

- ✅ `approversService.ts` - registerApprover, deactivate, reactivate
- ✅ `propertyService.ts` - registerProperty, issuePropertyTitle, updateProperty
- ✅ `transferService.ts` - configure, approve, accept, execute

### 3. Deploy dos Contratos

O deploy também precisa usar gas price > 0:

```bash
forge script script/DeployPropertyTitleTREX.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --private-key $ADMIN_PRIVATE_KEY \
  --broadcast \
  --legacy \
  --with-gas-price 1000
```

**Nota:** Usamos `1000` wei para dar uma margem de segurança.

---

## Endereços dos Contratos Deployed

**Arquivo:** `backend-example/DEPLOYED_ADDRESSES.txt`

```
PROPERTY_TITLE_ADDRESS=0xd2c99fd420074331ce18337e29126878d5f30229
APPROVALS_MODULE_ADDRESS=0x74df12b5d3902d7dc123b2194ec8d20aa9c505bb
REGISTRY_MODULE_ADDRESS=0x79270e1fd353d902c39ed231df9e59d6c15839af
APPROVERS_REGISTRY_ADDRESS=0x842f8a2edee57372509cdc85ae86cee5c68db67f
IDENTITY_REGISTRY_ADDRESS=0xc278fe6acad7dea524330366599063612cca916e
MODULAR_COMPLIANCE_ADDRESS=0x09ec6c6db20413dfa339be1db8504deb3abb0c13
```

---

## Como Aplicar

### Passo 1: Atualizar o `.env`

Abra `backend-example/.env` e **substitua** as linhas dos endereços pelos valores acima:

```bash
# Abra o arquivo
nano backend-example/.env

# OU copie diretamente do arquivo DEPLOYED_ADDRESSES.txt
cat backend-example/DEPLOYED_ADDRESSES.txt
```

### Passo 2: Reiniciar a API

```bash
cd backend-example
npm run dev
```

### Passo 3: Testar no Postman

Agora você pode testar o endpoint:

```
POST http://localhost:3000/api/approvers/register

Body:
{
  "wallet": "0x1234567890123456789012345678901234567890",
  "type": 0,
  "name": "Cartório 1º Ofício",
  "document": "12.345.678/0001-90"
}
```

**Deve funcionar! ✅**

---

## Por que gasPrice = 1 e não 0?

Embora o Besu aceite `--min-gas-price=0` na configuração:

1. **Internamente**, o Besu valida que o gas price deve ser **> 0**
2. O valor `1 wei` é praticamente gratuito:
   - 1 wei = 0.000000000000000001 ETH
   - Custo de uma transação: ~0.0000001 ETH
3. É uma rede privada, então o custo é irrelevante

---

## Scripts Atualizados

Se você usar scripts para fazer deploy, sempre use `--with-gas-price`:

```bash
# Deploy script
forge script script/DeployPropertyTitleTREX.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --legacy \
  --with-gas-price 1000

# Ou qualquer outro script que faça deploy
forge script script/SetupRoles.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --legacy \
  --with-gas-price 1000
```

---

## Verificação

Para verificar que a correção funcionou:

### 1. API está rodando?
```bash
curl http://localhost:3000/health
```

### 2. Blockchain está respondendo?
```bash
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### 3. Contratos foram deployados?
```bash
# Verifica se o PropertyTitleTREX existe
cast code 0xd2c99fd420074331ce18337e29126878d5f30229 --rpc-url http://127.0.0.1:8545
```

Se retornar código (não vazio), está OK! ✅

---

## Resumo das Mudanças

| Arquivo | Mudança | Status |
|---------|---------|--------|
| `blockchain.ts` | Adicionado `defaultTxOptions` com `gasPrice: 1` | ✅ |
| `approversService.ts` | Todas transações com `gasPrice: 1` | ✅ |
| `propertyService.ts` | Todas transações com `gasPrice: 1` | ✅ |
| `transferService.ts` | Todas transações com `gasPrice: 1` | ✅ |
| Deploy Script | Usar `--with-gas-price 1000` | ✅ |
| `.env` | Atualizar endereços dos contratos | ⏳ **VOCÊ PRECISA FAZER** |

---

## Próximos Passos

1. ✅ **Atualizar `.env`** com os endereços dos contratos
2. ✅ **Reiniciar API**: `npm run dev`
3. ✅ **Testar no Postman**: Importar collection e testar endpoints
4. 🎉 **Profit!**

---

**Bons testes! 🚀**

