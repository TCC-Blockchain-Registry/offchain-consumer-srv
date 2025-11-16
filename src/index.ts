import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkConnection, checkBalances } from './config/blockchain';

import approversRoutes from './routes/approvers.routes';
import propertyRoutes from './routes/property.routes';
import transferRoutes from './routes/transfer.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api/approvers', approversRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/transfers', transferRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Besu Property Ledger API'
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Besu Property Ledger API',
    version: '1.0.0',
    description: 'API REST para tokenização de imóveis com ERC-3643',
    endpoints: {
      health: 'GET /health',
      approvers: {
        register: 'POST /api/approvers/register',
        list: 'GET /api/approvers',
        info: 'GET /api/approvers/:wallet',
        validate: 'GET /api/approvers/validate/:wallet',
        recommended: 'GET /api/approvers/recommended/list',
        validateList: 'POST /api/approvers/validate-list',
        deactivate: 'POST /api/approvers/:wallet/deactivate',
        reactivate: 'POST /api/approvers/:wallet/reactivate'
      },
      properties: {
        register: 'POST /api/properties/register',
        get: 'GET /api/properties/:matriculaId',
        getCompliance: 'GET /api/properties/compliance/:matriculaId',
        byOwner: 'GET /api/properties/owner/:address',
        getOwner: 'GET /api/properties/:matriculaId/owner',
        exists: 'GET /api/properties/:matriculaId/exists',
        frozen: 'GET /api/properties/:matriculaId/frozen',
        update: 'PUT /api/properties/:matriculaId'
      },
      transfers: {
        configure: 'POST /api/transfers/configure',
        approve: 'POST /api/transfers/approve',
        accept: 'POST /api/transfers/accept',
        execute: 'POST /api/transfers/execute',
        status: 'GET /api/transfers/status',
        details: 'GET /api/transfers/details',
        hasApproved: 'GET /api/transfers/has-approved'
      }
    },
    documentation: {
      readme: 'https://github.com/...',
      workflow: {
        registerProperty: [
          '1. POST /api/properties/register - Registra imóvel no compliance e emite título'
        ],
        transferProperty: [
          '1. GET /api/approvers/recommended/list - Obter aprovadores necessários',
          '2. POST /api/transfers/configure - Configurar transferência com aprovadores',
          '3. POST /api/transfers/approve - Cada aprovador aprova (múltiplas chamadas)',
          '4. POST /api/transfers/accept - Comprador aceita',
          '5. POST /api/transfers/execute - Vendedor executa transferência final',
          '6. GET /api/transfers/details - Verificar status a qualquer momento'
        ]
      }
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.path,
    method: req.method,
    availableEndpoints: '/ para ver todos os endpoints'
  });
});

app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

async function start() {
  try {
    console.log('\n🚀 Iniciando Besu Property Ledger API...\n');

    console.log('🔗 Verificando conexão com blockchain...');
    const connected = await checkConnection();
    if (!connected) {
      throw new Error('❌ Falha ao conectar com blockchain');
    }

    console.log('\n💰 Verificando saldos das contas...');
    await checkBalances();

    console.log('\n📝 Endereços dos contratos:');
    console.log(`  PropertyTitle: ${process.env.PROPERTY_TITLE_ADDRESS}`);
    console.log(`  ApprovalsModule: ${process.env.APPROVALS_MODULE_ADDRESS}`);
    console.log(`  RegistryModule: ${process.env.REGISTRY_MODULE_ADDRESS}`);
    console.log(`  ApproversRegistry: ${process.env.APPROVERS_REGISTRY_ADDRESS}`);
    console.log(`  IdentityRegistry: ${process.env.IDENTITY_REGISTRY_ADDRESS}`);
    console.log(`  Compliance: ${process.env.MODULAR_COMPLIANCE_ADDRESS}`);

    app.listen(PORT, () => {
      console.log(`\n✅ API rodando em http://localhost:${PORT}`);
      console.log(`📖 Documentação: http://localhost:${PORT}/`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log('\n📋 Endpoints principais:');
      console.log(`   Aprovadores: http://localhost:${PORT}/api/approvers`);
      console.log(`   Propriedades: http://localhost:${PORT}/api/properties`);
      console.log(`   Transferências: http://localhost:${PORT}/api/transfers`);
      console.log('\n🎯 Pronto para receber requisições!\n');
    });

  } catch (error: any) {
    console.error('❌ Erro ao iniciar:', error.message);
    console.error('\n💡 Verifique:');
    console.error('   1. Se o arquivo .env existe e está configurado corretamente');
    console.error('   2. Se a blockchain está rodando (docker-compose up)');
    console.error('   3. Se os contratos foram deployados');
    console.error('   4. Se os endereços no .env estão corretos\n');
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('\n\n👋 Encerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Encerrando servidor...');
  process.exit(0);
});

start();

