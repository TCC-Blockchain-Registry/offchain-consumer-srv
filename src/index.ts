import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import { checkConnection, checkBalances } from './config/blockchain';

import propertyRoutes from './routes/property.routes';
import transferRoutes from './routes/transfer.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api/properties', propertyRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/admin', adminRoutes);

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
    version: '2.0.0',
    description: 'API REST para tokenização de imóveis com ERC-3643',
    architecture: 'Simplified - 2 main routes (properties + transfers) with integrated approvals',
    endpoints: {
      health: 'GET /health',
      properties: {
        description: 'Property registration and queries',
        register: 'POST /api/properties/register',
        get: 'GET /api/properties/:matriculaId',
        getCompliance: 'GET /api/properties/compliance/:matriculaId',
        byOwner: 'GET /api/properties/owner/:address',
        countByOwner: 'GET /api/properties/count/:address',
        getOwner: 'GET /api/properties/:matriculaId/owner',
        exists: 'GET /api/properties/:matriculaId/exists',
        update: 'PUT /api/properties/:matriculaId',
        approvals: {
          description: 'Property registration approval workflow',
          request: 'POST /api/properties/approvals/request',
          approveFinancial: 'POST /api/properties/approvals/:requestHash/financial',
          approveRegistry: 'POST /api/properties/approvals/:requestHash/registry-office',
          approveMunicipality: 'POST /api/properties/approvals/:requestHash/municipality (AUTO-EXECUTES)',
          status: 'GET /api/properties/approvals/:requestHash/status',
          note: '⚡ Auto-executes when all 3 approvals received'
        }
      },
      transfers: {
        description: 'Property transfer operations',
        request: 'POST /api/transfers/request',
        approvals: {
          description: 'Property transfer approval workflow',
          approveFinancial: 'POST /api/transfers/approvals/:requestHash/financial',
          approveRegistry: 'POST /api/transfers/approvals/:requestHash/registry-office',
          approveMunicipality: 'POST /api/transfers/approvals/:requestHash/municipality (AUTO-EXECUTES)',
          status: 'GET /api/transfers/approvals/:requestHash/status',
          note: '⚡ Auto-executes when all 3 approvals received'
        }
      },
      admin: {
        description: 'Role management endpoints (requires admin permissions)',
        info: 'GET /api/admin/info',
        grantRole: 'POST /api/admin/grant-role',
        revokeRole: 'POST /api/admin/revoke-role',
        grantInstitutionalRoles: 'POST /api/admin/grant-institutional-roles',
        checkRole: 'POST /api/admin/check-role',
        getRoles: 'GET /api/admin/roles/:address',
        getAddressesWithRole: 'GET /api/admin/roles/:roleName/addresses',
        note: '🔐 Admin endpoints for managing access control roles'
      }
    },
    documentation: {
      workflow: {
        registerProperty: [
          '1. POST /api/properties/approvals/request - Request property registration',
          '2. POST /api/properties/approvals/:hash/financial - Financial institution approves',
          '3. POST /api/properties/approvals/:hash/registry-office - Registry office approves',
          '4. POST /api/properties/approvals/:hash/municipality - Municipality approves (AUTO-EXECUTES)',
          '5. GET /api/properties/approvals/:hash/status - Check approval status'
        ],
        transferProperty: [
          '1. POST /api/transfers/request - Request property transfer',
          '2. POST /api/transfers/approvals/:hash/financial - Financial institution approves',
          '3. POST /api/transfers/approvals/:hash/registry-office - Registry office approves',
          '4. POST /api/transfers/approvals/:hash/municipality - Municipality approves (AUTO-EXECUTES)',
          '5. GET /api/transfers/approvals/:hash/status - Check transfer status'
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

function startEventListener() {
  try {
    console.log('\n🎧 Iniciando Event Listener...\n');

    // Path to event-listener.js (in production it's in the parent directory of dist)
    const eventListenerPath = path.join(__dirname, '..', 'event-listener.js');

    const eventListener = spawn('node', [eventListenerPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env
    });

    // Pipe stdout
    eventListener.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    // Pipe stderr
    eventListener.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    eventListener.on('error', (error) => {
      console.error('❌ Erro ao iniciar event listener:', error.message);
    });

    eventListener.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        console.error(`❌ Event listener encerrado com código ${code}`);
        console.log('🔄 Reiniciando event listener em 5 segundos...');
        setTimeout(startEventListener, 5000);
      }
    });

    console.log('✅ Event Listener iniciado!\n');
  } catch (error: any) {
    console.error('❌ Erro ao iniciar event listener:', error.message);
  }
}

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
    console.log(`  RegistryModule: ${process.env.REGISTRY_MODULE_ADDRESS}`);
    console.log(`  IdentityRegistry: ${process.env.IDENTITY_REGISTRY_ADDRESS}`);
    console.log(`  Compliance: ${process.env.MODULAR_COMPLIANCE_ADDRESS}`);

    app.listen(PORT, () => {
      console.log(`\n✅ API rodando em http://localhost:${PORT}`);
      console.log(`📖 Documentação: http://localhost:${PORT}/`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log('\n📋 Rotas principais:');
      console.log(`   🏠 Propriedades: http://localhost:${PORT}/api/properties`);
      console.log(`   🔄 Transferências: http://localhost:${PORT}/api/transfers`);
      console.log(`   🔐 Admin (Roles): http://localhost:${PORT}/api/admin`);
      console.log('\n🎯 Pronto para receber requisições!\n');

      // Start event listener
      startEventListener();
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

