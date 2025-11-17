import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import IdentityRegistryABI from '../abis/IdentityRegistry.json';

const router = Router();

// Provider customizado para Besu
class LegacyProvider extends ethers.JsonRpcProvider {
  async getFeeData(): Promise<ethers.FeeData> {
    return new ethers.FeeData(
      ethers.toBigInt(1000),
      null,
      null
    );
  }

  async resolveName(name: string): Promise<null> {
    return null;
  }
}

/**
 * POST /api/setup/grant-agent-role
 * Concede AGENT_ROLE ao adminWallet (uso em desenvolvimento)
 */
router.post('/grant-agent-role', async (req: Request, res: Response) => {
  try {
    console.log('\n🔐 Concedendo AGENT_ROLE ao adminWallet...\n');

    const provider = new LegacyProvider(process.env.RPC_URL!, {
      chainId: Number(process.env.CHAIN_ID) || 1337,
      name: 'besu-private',
    });

    const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);
    console.log(`👤 Admin wallet: ${adminWallet.address}`);

    const identityRegistry = new ethers.Contract(
      process.env.IDENTITY_REGISTRY_ADDRESS!,
      IdentityRegistryABI,
      adminWallet
    );

    // Verificar se já tem permissão
    console.log('\n📋 Verificando permissões...');
    try {
      const isAgent = await identityRegistry.isAgent(adminWallet.address);
      console.log(`   Admin já é Agent: ${isAgent}`);
      
      if (isAgent) {
        return res.json({
          success: true,
          message: 'Admin wallet já tem permissão AGENT_ROLE',
          data: {
            adminWallet: adminWallet.address,
            alreadyGranted: true
          }
        });
      }
    } catch (e: any) {
      console.log(`⚠️  Não foi possível verificar: ${e.message}`);
    }

    // Tentar conceder permissão
    console.log('\n📝 Concedendo permissão de Agent...');
    
    try {
      // Tentar addAgent primeiro (mais comum em Identity Registry)
      const tx = await identityRegistry.addAgent(adminWallet.address, {
        type: 0,
        gasLimit: 100000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      const receipt = await tx.wait();
      
      console.log(`✅ Agent adicionado com sucesso!`);
      console.log(`   Block: ${receipt.blockNumber}`);
      console.log(`   TX Hash: ${tx.hash}\n`);

      return res.json({
        success: true,
        message: 'AGENT_ROLE concedida com sucesso',
        data: {
          adminWallet: adminWallet.address,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber
        }
      });

    } catch (error: any) {
      console.error(`❌ Erro ao adicionar agent:`, error.message);
      
      return res.status(500).json({
        error: 'Falha ao conceder AGENT_ROLE',
        details: error.message,
        suggestions: [
          'Verifique se o adminWallet é o owner do contrato',
          'Verifique se o contrato tem a função addAgent()',
          'Execute o script de deploy novamente com a carteira correta'
        ]
      });
    }

  } catch (error: any) {
    console.error(`❌ Erro geral:`, error.message);
    res.status(500).json({
      error: 'Erro ao processar requisição',
      details: error.message
    });
  }
});

/**
 * GET /api/setup/check-permissions
 * Verifica permissões do adminWallet
 */
router.get('/check-permissions', async (req: Request, res: Response) => {
  try {
    const provider = new LegacyProvider(process.env.RPC_URL!, {
      chainId: Number(process.env.CHAIN_ID) || 1337,
      name: 'besu-private',
    });

    const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);
    
    const identityRegistry = new ethers.Contract(
      process.env.IDENTITY_REGISTRY_ADDRESS!,
      IdentityRegistryABI,
      adminWallet
    );

    // Verificar várias permissões
    const checks: any = {
      adminWallet: adminWallet.address,
      identityRegistry: process.env.IDENTITY_REGISTRY_ADDRESS
    };

    try {
      checks.owner = await identityRegistry.owner();
      checks.isOwner = checks.owner.toLowerCase() === adminWallet.address.toLowerCase();
    } catch (e) {
      checks.owner = 'N/A';
      checks.isOwner = false;
    }

    try {
      checks.isAgent = await identityRegistry.isAgent(adminWallet.address);
    } catch (e) {
      checks.isAgent = 'unknown';
    }

    try {
      checks.isVerified = await identityRegistry.isVerified(adminWallet.address);
    } catch (e) {
      checks.isVerified = 'unknown';
    }

    res.json({
      success: true,
      data: checks
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao verificar permissões',
      details: error.message
    });
  }
});

export default router;

