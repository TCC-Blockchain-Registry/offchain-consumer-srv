# Diagramas do Sistema - Registro e Transferência de Propriedades

Este diretório contém os diagramas de fluxo e sequência para os dois principais processos do sistema:
- **Registro de Propriedade**
- **Transferência de Propriedade**

## 📂 Arquivos Disponíveis

### Formato PlantUML (.puml)

**Fluxogramas:**
- `registro-fluxograma.puml` - Fluxograma do processo de registro
- `transferencia-fluxograma.puml` - Fluxograma do processo de transferência

**Diagramas de Sequência - Completos:**
- `registro-sequencia-completo.puml` - Diagrama de sequência completo do registro
- `transferencia-sequencia-completo.puml` - Diagrama de sequência completo da transferência

**Diagramas de Sequência - Divididos (Recomendado para TCC):**
- `registro-parte1-solicitacao.puml` - Registro: Solicitação até confirmação na blockchain
- `registro-parte2-aprovacoes.puml` - Registro: Aprovações institucionais e execução
- `transferencia-parte1-solicitacao.puml` - Transferência: Solicitação até confirmação na blockchain
- `transferencia-parte2-aprovacoes.puml` - Transferência: Aprovações, aceitação do comprador e execução

### Formato Mermaid (.mmd)

**Fluxogramas:**
- `registro-fluxograma.mmd` - Fluxograma do processo de registro
- `transferencia-fluxograma.mmd` - Fluxograma do processo de transferência

**Diagramas de Sequência - Completos:**
- `registro-sequencia-completo.mmd` - Diagrama de sequência completo do registro
- `transferencia-sequencia-completo.mmd` - Diagrama de sequência completo da transferência

**Diagramas de Sequência - Divididos (Recomendado para TCC):**
- `registro-parte1-solicitacao.mmd` - Registro: Solicitação até confirmação na blockchain
- `registro-parte2-aprovacoes.mmd` - Registro: Aprovações institucionais e execução
- `transferencia-parte1-solicitacao.mmd` - Transferência: Solicitação até confirmação na blockchain
- `transferencia-parte2-aprovacoes.mmd` - Transferência: Aprovações, aceitação do comprador e execução

## ⚠️ Diagramas Divididos vs. Completos

### Por que dois formatos?

**Diagramas Completos:**
- Mostram todo o fluxo de ponta a ponta em um único diagrama
- Ideal para visão geral do sistema
- Útil para apresentações em slides ou telas grandes
- Pode ser difícil de ler quando impresso em folha A4

**Diagramas Divididos (Recomendado para TCC):**
- Divididos em 2 partes: **Solicitação** e **Aprovações/Execução**
- Cabem perfeitamente em páginas A4 de trabalhos acadêmicos
- Mais legíveis quando impressos
- Facilitam a explicação passo a passo do processo

### Divisão dos Processos

#### Registro de Propriedade

**Parte 1 - Solicitação (`registro-parte1-solicitacao`):**
- Usuário preenche formulário → Frontend → BFF → Orchestrator
- Armazenamento no banco de dados (PENDENTE)
- Job assíncrono (RabbitMQ → Queue Worker)
- Chamada ao Offchain Consumer → Blockchain
- Transação `requestPropertyRegistration()` minerada
- Evento `RegistrationRequested` → Webhook → Orchestrator
- Status atualizado com `request_hash` e `blockchain_tx_hash`
- **Resultado:** Propriedade aguardando aprovações (PROCESSANDO_REGISTRO)

**Parte 2 - Aprovações e Execução (`registro-parte2-aprovacoes`):**
- **Aprovadores institucionais chamam API diretamente** (não passam pelo Frontend/BFF)
- 3 aprovações necessárias:
  1. Instituição Financeira → POST /api/properties/approve
  2. Cartório → POST /api/properties/approve
  3. Prefeitura → POST /api/properties/approve
- Cada aprovação gera evento `RegistrationApproved`
- **Auto-execução:** Quando 3ª aprovação confirmada, smart contract executa automaticamente
- Mint de tokens para o proprietário
- Evento `RegistrationExecuted` → Webhook → Orchestrator
- **Resultado:** Propriedade registrada (status: OK)

#### Transferência de Propriedade

**Parte 1 - Solicitação (`transferencia-parte1-solicitacao`):**
- Comprador seleciona propriedade → Frontend → BFF → Orchestrator
- Validações (propriedade OK, sem transferência ativa, comprador != vendedor)
- Criação no banco de dados (PENDENTE → CONFIGURANDO)
- Job assíncrono (RabbitMQ → Queue Worker)
- Chamada ao Offchain Consumer → Blockchain
- Transação `requestPropertyTransfer()` minerada
- Evento `TransferRequested` → Webhook → Orchestrator
- Status atualizado com `request_hash` e `blockchain_tx_hash`
- **Resultado:** Transferência aguardando aprovações (AGUARDANDO_APROVACOES)

**Parte 2 - Aprovações, Aceitação e Execução (`transferencia-parte2-aprovacoes`):**
- **Aprovadores institucionais chamam API diretamente** (não passam pelo Frontend/BFF)
- 3 aprovações necessárias:
  1. Instituição Financeira → POST /api/transfers/approve
  2. Cartório → POST /api/transfers/approve
  3. Prefeitura → POST /api/transfers/approve
- Cada aprovação gera evento `TransferApproved`
- **Aceitação do comprador:** Comprador aceita via Frontend → BFF → Orchestrator
- Orchestrator chama Offchain Consumer → Blockchain (`buyerAcceptsTransfer`)
- **Auto-execução:** Quando 3 aprovações + aceitação confirmadas, smart contract executa automaticamente
- Transfer de tokens: vendedor → comprador
- Evento `TransferExecuted` → Webhook → Orchestrator
- **Resultado:** Transferência concluída (status: CONCLUIDA), proprietário atualizado

### ⭐ Distinção Importante: Dois Tipos de Usuários

O sistema possui dois fluxos de autenticação diferentes:

**Usuários Regulares (Proprietários, Compradores):**
- Autenticam via Frontend (login com CPF/senha)
- Recebem JWT token
- Todas as requisições passam por: Frontend → BFF → Orchestrator
- JWT validado em cada requisição

**Aprovadores Institucionais (Instituição Financeira, Cartório, Prefeitura):**
- **Chamam o Offchain Consumer API diretamente** (API pública)
- Não passam pelo Frontend/BFF/Orchestrator
- Autenticação via chave privada Ethereum (assinatura de transações)
- Autorização validada nos smart contracts (role-based access control)
- Exemplos de endpoints:
  - POST `/api/properties/approve`
  - POST `/api/transfers/approve`

Esta distinção é **fundamental** para entender a arquitetura do sistema e está corretamente representada nos **diagramas divididos**.

## 🎨 Como Visualizar os Diagramas

### 1. Draw.io (diagrams.net)

**Para arquivos PlantUML (.puml):**
1. Abra https://app.diagrams.net/
2. Clique em `File` → `Import from` → `PlantUML`
3. Cole o conteúdo do arquivo `.puml` ou faça upload
4. O diagrama será renderizado automaticamente

**Para arquivos Mermaid (.mmd):**
1. Abra https://app.diagrams.net/
2. Clique em `Arrange` → `Insert` → `Advanced` → `Mermaid`
3. Cole o conteúdo do arquivo `.mmd`
4. Clique em `Insert`

### 2. Excalidraw

**Método 1 - Converter para imagem primeiro:**
```bash
# Instalar PlantUML
brew install plantuml  # macOS
sudo apt-get install plantuml  # Linux

# Gerar PNG
plantuml registro-fluxograma.puml
plantuml registro-sequencia.puml
plantuml transferencia-fluxograma.puml
plantuml transferencia-sequencia.puml

# Importar PNGs no Excalidraw
```

**Método 2 - Plugin Mermaid:**
1. Abra https://excalidraw.com/
2. Instale o plugin Mermaid
3. Cole o conteúdo dos arquivos `.mmd`

### 3. VS Code

**Para PlantUML:**
1. Instale a extensão: `PlantUML` (jebbs.plantuml)
2. Abra qualquer arquivo `.puml`
3. Pressione `Alt+D` para preview

**Para Mermaid:**
1. Instale a extensão: `Markdown Preview Mermaid Support`
2. Crie um arquivo `.md` e cole o conteúdo do `.mmd` dentro de um bloco:
   ````markdown
   ```mermaid
   [conteúdo do arquivo .mmd]
   ```
   ````
3. Pressione `Ctrl+Shift+V` para preview

### 4. PlantUML Online

1. Acesse https://www.plantuml.com/plantuml/uml/
2. Cole o conteúdo do arquivo `.puml`
3. Clique em `Submit`
4. Exporte como PNG, SVG ou PDF

### 5. Mermaid Live Editor

1. Acesse https://mermaid.live/
2. Cole o conteúdo do arquivo `.mmd`
3. O diagrama é renderizado em tempo real
4. Exporte como PNG ou SVG

### 6. IntelliJ IDEA / WebStorm

1. Instale o plugin `PlantUML Integration`
2. Abra qualquer arquivo `.puml`
3. O preview aparece automaticamente ao lado

## 📊 Tipos de Diagramas

### Fluxogramas
Mostram o fluxo de controle e decisões do processo:
- Estados do sistema (PENDENTE, CONFIGURANDO, etc.)
- Condições e validações
- Caminhos de sucesso e erro

### Diagramas de Sequência
Mostram a comunicação entre componentes:
- Ordem temporal das mensagens
- Interação entre Frontend, BFF, Orchestrator, Blockchain, etc.
- Eventos assíncronos e webhooks

## 🔄 Processos Documentados

### Registro de Propriedade
**Fluxo:**
1. Usuário submete formulário
2. Validações (matrícula única, dados válidos)
3. Criação no banco (PENDENTE)
4. Job assíncrono para blockchain
5. Transação: `requestPropertyRegistration()`
6. Evento `RegistrationRequested` → Webhook
7. Aguardar 3 aprovações (Financial, Registry, Municipality)
8. Auto-execução: mint tokens
9. Evento `RegistrationExecuted` → Webhook
10. Status: OK

**Componentes envolvidos:**
- Frontend, BFF Gateway, Orchestrator
- PostgreSQL, RabbitMQ, Queue Worker
- Offchain Consumer, Blockchain (Besu)
- Event Listener

### Transferência de Propriedade
**Fluxo:**
1. Comprador solicita transferência
2. Validações (propriedade OK, sem transferência ativa)
3. Criação no banco (PENDENTE → CONFIGURANDO)
4. Job assíncrono para blockchain
5. Transação: `requestPropertyTransfer()`
6. Evento `TransferRequested` → Webhook
7. Status: AGUARDANDO_APROVACOES
8. Aguardar 3 aprovações + aceitação do comprador
9. Auto-execução: transfer tokens
10. Evento `TransferExecuted` → Webhook
11. Atualizar proprietário, Status: CONCLUIDA

**Componentes envolvidos:**
- Frontend, BFF Gateway, Orchestrator
- PostgreSQL, RabbitMQ, Queue Worker
- Offchain Consumer, Blockchain (Besu)
- Event Listener

## 🔧 Gerando Imagens dos Diagramas

### Usando PlantUML CLI

```bash
# Instalar PlantUML
brew install plantuml  # macOS
sudo apt-get install plantuml  # Linux
choco install plantuml  # Windows

# Gerar PNGs
plantuml *.puml

# Gerar SVGs
plantuml -tsvg *.puml

# Gerar PDFs
plantuml -tpdf *.puml
```

### Usando Mermaid CLI

```bash
# Instalar Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Gerar PNGs
mmdc -i registro-fluxograma.mmd -o registro-fluxograma.png
mmdc -i registro-sequencia.mmd -o registro-sequencia.png
mmdc -i transferencia-fluxograma.mmd -o transferencia-fluxograma.png
mmdc -i transferencia-sequencia.mmd -o transferencia-sequencia.png

# Gerar SVGs
mmdc -i registro-fluxograma.mmd -o registro-fluxograma.svg
```

## 📝 Editando os Diagramas

### PlantUML
- Sintaxe: https://plantuml.com/guide
- Referência completa: https://plantuml.com/

### Mermaid
- Sintaxe: https://mermaid.js.org/intro/
- Editor online: https://mermaid.live/

## 🎯 Casos de Uso

### Apresentações
Use os arquivos `.puml` ou `.mmd` e exporte para PNG/SVG de alta resolução.

### Documentação Técnica
Inclua os arquivos nos READMEs usando blocos Mermaid (GitHub renderiza automaticamente):

````markdown
```mermaid
[conteúdo do arquivo .mmd]
```
````

### Análise de Fluxo
Use os diagramas de sequência para debugar problemas de comunicação entre componentes.

### Onboarding de Desenvolvedores
Use os fluxogramas para explicar o funcionamento do sistema.

## 📚 Guia Rápido para TCC

### Diagrams Recomendados

Para trabalhos acadêmicos (TCC), recomendamos usar os **diagramas divididos**:

**Capítulo sobre Registro de Propriedades:**
1. Figura 1: `registro-parte1-solicitacao` (Solicitação e confirmação blockchain)
2. Figura 2: `registro-parte2-aprovacoes` (Aprovações institucionais e execução)

**Capítulo sobre Transferência de Propriedades:**
1. Figura 3: `transferencia-parte1-solicitacao` (Solicitação e confirmação blockchain)
2. Figura 4: `transferencia-parte2-aprovacoes` (Aprovações, aceitação e execução)

### Gerando Imagens para o TCC

```bash
# Opção 1: PlantUML CLI (requer Java)
plantuml -tpng registro-parte1-solicitacao.puml
plantuml -tpng registro-parte2-aprovacoes.puml
plantuml -tpng transferencia-parte1-solicitacao.puml
plantuml -tpng transferencia-parte2-aprovacoes.puml

# Opção 2: Mermaid CLI (requer Node.js)
mmdc -i registro-parte1-solicitacao.mmd -o registro-parte1.png -w 1200 -H 1600
mmdc -i registro-parte2-aprovacoes.mmd -o registro-parte2.png -w 1200 -H 1600
mmdc -i transferencia-parte1-solicitacao.mmd -o transferencia-parte1.png -w 1200 -H 1600
mmdc -i transferencia-parte2-aprovacoes.mmd -o transferencia-parte2.png -w 1200 -H 1600

# Opção 3: Usar editores online
# - PlantUML Online: https://www.plantuml.com/plantuml/uml/
# - Mermaid Live: https://mermaid.live/
# Ambos permitem exportar diretamente como PNG de alta resolução
```

### Exemplos de Legendas

**Figura 1:** Diagrama de sequência do processo de registro de propriedade - Parte 1: Solicitação e confirmação na blockchain. O usuário submete o formulário através do frontend, que é processado pelo orquestrador e enviado de forma assíncrona para a blockchain. O evento de confirmação retorna via webhook atualizando o status no banco de dados.

**Figura 2:** Diagrama de sequência do processo de registro de propriedade - Parte 2: Aprovações institucionais e execução. As três instituições aprovadoras (Financeira, Cartório e Prefeitura) chamam a API pública diretamente. Quando a terceira aprovação é confirmada, o smart contract executa automaticamente o mint dos tokens para o proprietário.

**Figura 3:** Diagrama de sequência do processo de transferência de propriedade - Parte 1: Solicitação e confirmação na blockchain. O comprador solicita a transferência através do frontend, que é validada pelo orquestrador e enviada de forma assíncrona para a blockchain. O evento de confirmação retorna via webhook atualizando o status no banco de dados.

**Figura 4:** Diagrama de sequência do processo de transferência de propriedade - Parte 2: Aprovações, aceitação e execução. As três instituições aprovadoras chamam a API pública diretamente, o comprador aceita a transferência via frontend, e quando todas as condições são atendidas, o smart contract executa automaticamente a transferência dos tokens do vendedor para o comprador.

### Pontos-Chave para Mencionar no Texto

1. **Arquitetura Assíncrona:** O sistema utiliza RabbitMQ para processamento assíncrono de transações blockchain, evitando timeouts em requisições HTTP.

2. **Webhook Bidirecionais:** O Event Listener monitora eventos da blockchain e envia webhooks para o Orchestrator, mantendo sincronização entre dados on-chain e off-chain.

3. **Dois Fluxos de Autenticação:** Usuários regulares autenticam via JWT (Frontend → BFF → Orchestrator), enquanto aprovadores institucionais chamam API pública diretamente com autenticação via assinatura Ethereum.

4. **Auto-Execução:** Quando todas as aprovações necessárias são confirmadas, o smart contract executa automaticamente a operação (mint ou transfer), sem necessidade de chamada adicional.

5. **Estados do Sistema:** As propriedades e transferências transitam por estados bem definidos (PENDENTE → CONFIGURANDO → AGUARDANDO_APROVACOES → CONCLUIDA/OK), permitindo rastreamento completo do processo.

## 📞 Suporte

Para dúvidas sobre os diagramas ou sobre o sistema:
- Consulte o `CLAUDE.md` na raiz do projeto
- Revise os logs de desenvolvimento (`*.md` na raiz)
- Verifique a documentação de cada serviço

---

**Última atualização:** 2025-11-24
**Autor:** Sistema de documentação automatizada
