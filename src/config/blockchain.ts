import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Provider CUSTOMIZADO para forçar transações Legacy e desabilitar ENS
class LegacyProvider extends ethers.JsonRpcProvider {
  async getBlock(blockHashOrBlockTag: any, prefetchTxs?: boolean): Promise<null | ethers.Block> {
    const block = await super.getBlock(blockHashOrBlockTag, prefetchTxs);
    if (block) {
      // Remover baseFeePerGas para forçar transações legacy
      (block as any).baseFeePerGas = null;
    }
    return block;
  }

  async getFeeData(): Promise<ethers.FeeData> {
    return new ethers.FeeData(
      BigInt(1000), // gasPrice
      null, // maxFeePerGas (null = não suporta EIP-1559)
      null  // maxPriorityFeePerGas (null = não suporta EIP-1559)
    );
  }

  // Desabilitar resolução ENS (não suportado na rede privada)
  async resolveName(name: string): Promise<null> {
    return null;
  }
}

// Provider (conexão com a blockchain)
const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
export const provider = new LegacyProvider(rpcUrl, {
  chainId: Number(process.env.CHAIN_ID) || 1337,
  name: 'besu-private',
});

// Wallets (signers) para diferentes roles
export const adminWallet = new ethers.Wallet(
  process.env.ADMIN_PRIVATE_KEY!,
  provider
);

export const orchestratorWallet = new ethers.Wallet(
  process.env.ORCHESTRATOR_PRIVATE_KEY!,
  provider
);

export const registrarWallet = new ethers.Wallet(
  process.env.REGISTRAR_PRIVATE_KEY!,
  provider
);

// Verificar conexão
export async function checkConnection(): Promise<boolean> {
  try {
    const network = await provider.getNetwork();
    console.log(`✅ Conectado à rede: ${network.name} (Chain ID: ${network.chainId})`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar:', error);
    return false;
  }
}

// Verificar saldos (útil para debugging)
export async function checkBalances(): Promise<void> {
  const adminBalance = await provider.getBalance(adminWallet.address);
  const orchestratorBalance = await provider.getBalance(orchestratorWallet.address);
  const registrarBalance = await provider.getBalance(registrarWallet.address);
  
  console.log(`\n💰 Saldos:`);
  console.log(`  Admin (${adminWallet.address}): ${ethers.formatEther(adminBalance)} ETH`);
  console.log(`  Orchestrator (${orchestratorWallet.address}): ${ethers.formatEther(orchestratorBalance)} ETH`);
  console.log(`  Registrar (${registrarWallet.address}): ${ethers.formatEther(registrarBalance)} ETH`);
}

// Criar wallet a partir de private key
export function createWallet(privateKey: string): ethers.Wallet {
  return new ethers.Wallet(privateKey, provider);
}

// Opções padrão para transações (gas price = 1000 wei para rede privada)
// Nota: Besu não aceita gasPrice exatamente 0, precisa ser > 0
// Importante: Usar type: 0 para forçar transações Legacy (não EIP-1559)
export const defaultTxOptions = {
  type: 0, // Legacy transaction (não EIP-1559)
  gasPrice: 1000, // 1000 wei (mínimo aceito pelo Besu)
  gasLimit: 10000000 // Limite generoso para contratos complexos
};

// Helper para criar opções de transação customizadas
export function createTxOptions(overrides?: Partial<typeof defaultTxOptions>) {
  return {
    ...defaultTxOptions,
    ...overrides
  };
}

