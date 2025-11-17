import { ethers } from 'ethers';
import IdentityRegistryABI from '../abis/IdentityRegistry.json';

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

export interface RegisterIdentityResult {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  alreadyRegistered?: boolean;
}

export async function registerIdentity(walletAddress: string): Promise<RegisterIdentityResult> {
  try {
    console.log(`\n🔐 Registrando identidade para: ${walletAddress}\n`);

    // Setup provider e admin wallet
    const provider = new LegacyProvider(process.env.RPC_URL!, {
      chainId: Number(process.env.CHAIN_ID) || 1337,
      name: 'besu-private',
    });

    const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);
    console.log(`👤 Admin wallet: ${adminWallet.address}`);

    // Carregar contrato Identity Registry
    const identityRegistry = new ethers.Contract(
      process.env.IDENTITY_REGISTRY_ADDRESS!,
      IdentityRegistryABI,
      adminWallet
    );

    // Verificar se já está registrado
    console.log(`\n📋 Verificando identidade existente...`);
    const isVerified = await identityRegistry.isVerified(walletAddress);
    
    if (isVerified) {
      console.log(`✅ Wallet já tem identidade registrada!`);
      return { success: true, alreadyRegistered: true };
    }

    console.log(`📝 Registrando nova identidade...`);
    
    // Buscar o identity contract do admin como template
    const adminIdentity = await identityRegistry.identity(adminWallet.address);
    console.log(`   Usando identity contract template: ${adminIdentity}`);
    
    if (adminIdentity === ethers.ZeroAddress) {
      throw new Error('Admin wallet não tem identity contract configurado');
    }
    
    // Registrar identidade usando o mesmo identity contract do admin
    // NOTA: Em produção, cada usuário deveria ter seu próprio identity contract
    const tx = await identityRegistry.registerIdentity(
      walletAddress,
      adminIdentity, // Reutilizar o identity contract do admin para desenvolvimento
      76, // Country code: Brasil
      {
        type: 0,
        gasLimit: 300000,
        gasPrice: 1000
      }
    );

    console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
    const receipt = await tx.wait();
    
    console.log(`✅ Identidade registrada com sucesso!`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   TX Hash: ${tx.hash}\n`);

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      alreadyRegistered: false
    };

  } catch (error: any) {
    console.error(`❌ Erro ao registrar identidade:`, error.message);
    throw error;
  }
}

export async function verifyIdentity(walletAddress: string): Promise<{ isVerified: boolean; identityContract: string }> {
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

    const isVerified = await identityRegistry.isVerified(walletAddress);
    const identity = await identityRegistry.identity(walletAddress);

    return {
      isVerified,
      identityContract: identity
    };

  } catch (error: any) {
    console.error(`❌ Erro ao verificar identidade:`, error.message);
    throw error;
  }
}

