import { ethers } from 'ethers';

const IdentityRegistryABI = require('../abis/IdentityRegistry.json');
const IdentityABI = require('../abis/Identity.json');

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
 * IdentityService - Gerencia registro e verificação de identidades
 */
export class IdentityService {
  private provider: LegacyProvider;
  private adminWallet: ethers.Wallet;
  private identityRegistry: ethers.Contract;

  constructor() {
    this.provider = new LegacyProvider(process.env.RPC_URL!, {
      chainId: Number(process.env.CHAIN_ID) || 1337,
      name: 'besu-private',
    });

    this.adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, this.provider);

    this.identityRegistry = new ethers.Contract(
      process.env.IDENTITY_REGISTRY_ADDRESS!,
      IdentityRegistryABI.abi || IdentityRegistryABI,
      this.adminWallet
    );
  }

  /**
   * Verifica se um endereço está registrado no IdentityRegistry
   */
  async isVerified(address: string): Promise<boolean> {
    try {
      const verified = await this.identityRegistry.isVerified(address);
      return verified;
    } catch (error: any) {
      console.error(`❌ Erro ao verificar identidade de ${address}:`, error.message);
      throw error;
    }
  }

  /**
   * Registra uma nova identidade (deploy OnchainID + register no IdentityRegistry)
   */
  async registerIdentity(userAddress: string, countryCode: number = 76): Promise<{
    success: boolean;
    identityAddress: string;
    txHash: string;
  }> {
    try {
      console.log(`📝 Registrando identidade para ${userAddress}...`);

      // 1. Deploy OnchainID contract para o usuário
      console.log(`   🔨 Deployando contrato OnchainID...`);
      const identityFactory = new ethers.ContractFactory(
        IdentityABI.abi || IdentityABI,
        IdentityABI.bytecode,
        this.adminWallet
      );

      const identityContract = await identityFactory.deploy(
        userAddress,
        false, // isLibrary = false
        {
          type: 0,
          gasLimit: 3000000,
          gasPrice: 1000
        }
      );

      await identityContract.waitForDeployment();
      const identityAddress = await identityContract.getAddress();
      console.log(`   ✅ OnchainID deployed: ${identityAddress}`);

      // 2. Registrar no IdentityRegistry
      console.log(`   📋 Registrando no IdentityRegistry...`);
      const tx = await this.identityRegistry.registerIdentity(
        userAddress,
        identityAddress,
        countryCode,
        {
          type: 0,
          gasLimit: 500000,
          gasPrice: 1000
        }
      );

      console.log(`   ⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Identidade registrada com sucesso!`);
      console.log(`   Usuário: ${userAddress}`);
      console.log(`   OnchainID: ${identityAddress}`);

      return {
        success: true,
        identityAddress,
        txHash: tx.hash
      };

    } catch (error: any) {
      console.error(`❌ Erro ao registrar identidade:`, {
        message: error.message,
        reason: error.reason,
        code: error.code
      });
      throw new Error(`Falha ao registrar identidade: ${error.reason || error.message}`);
    }
  }

  /**
   * Verifica e registra identidade automaticamente se necessário
   */
  async ensureIdentityRegistered(address: string): Promise<void> {
    const isVerified = await this.isVerified(address);

    if (!isVerified) {
      console.log(`⚠️  Identidade não registrada para ${address}`);
      console.log(`   🔄 Registrando automaticamente...`);
      await this.registerIdentity(address);
    } else {
      console.log(`   ✓ Identidade já verificada: ${address}`);
    }
  }
}

export const identityService = new IdentityService();
