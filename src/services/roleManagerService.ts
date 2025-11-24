import { ethers } from 'ethers';

const PropertyTitleTREXABI = require('../abis/PropertyTitleTREX.json');

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
 * Roles disponíveis no sistema
 */
export enum SystemRole {
  FINANCIAL = 'FINANCIAL_ROLE',
  REGISTRY_OFFICE = 'REGISTRY_OFFICE_ROLE',
  MUNICIPALITY = 'MUNICIPALITY_ROLE',
  DEFAULT_ADMIN = 'DEFAULT_ADMIN_ROLE',
  AGENT = 'AGENT_ROLE',
  ISSUER = 'ISSUER_ROLE',
  ORCHESTRATOR = 'ORCHESTRATOR_ROLE',
  REGISTRAR = 'REGISTRAR_ROLE'
}

/**
 * Informações sobre uma role
 */
export interface RoleInfo {
  roleName: string;
  roleHash: string;
  hasRole: boolean;
}

/**
 * Resultado de uma operação de role
 */
export interface RoleOperationResult {
  success: boolean;
  roleName: string;
  roleHash: string;
  address: string;
  txHash?: string;
  blockNumber?: number;
  alreadyGranted?: boolean;
  error?: string;
}

/**
 * RoleManagerService - Gerencia roles e permissões nos contratos
 */
export class RoleManagerService {
  private provider: LegacyProvider;
  private adminWallet: ethers.Wallet;
  private token: ethers.Contract;

  constructor() {
    this.provider = new LegacyProvider(process.env.RPC_URL!, {
      chainId: Number(process.env.CHAIN_ID) || 1337,
      name: 'besu-private',
    });

    this.adminWallet = new ethers.Wallet(
      process.env.ADMIN_PRIVATE_KEY || process.env.PRIVATE_KEY!,
      this.provider
    );

    this.token = new ethers.Contract(
      process.env.TOKEN_ADDRESS!,
      PropertyTitleTREXABI.abi || PropertyTitleTREXABI,
      this.adminWallet
    );
  }

  /**
   * Calcula o hash de uma role a partir do nome
   */
  getRoleHash(roleName: string): string {
    // DEFAULT_ADMIN_ROLE é 0x00...00
    if (roleName === SystemRole.DEFAULT_ADMIN) {
      return ethers.ZeroHash;
    }
    return ethers.id(roleName);
  }

  /**
   * Verifica se um endereço possui uma role específica
   */
  async hasRole(roleName: string, address: string): Promise<boolean> {
    try {
      const roleHash = this.getRoleHash(roleName);
      const hasRole = await this.token.hasRole(roleHash, address);
      return hasRole;
    } catch (error: any) {
      console.error(`Erro ao verificar role ${roleName} para ${address}:`, error.message);
      throw new Error(`Falha ao verificar role: ${error.message}`);
    }
  }

  /**
   * Lista todas as roles de um endereço
   */
  async getRolesForAddress(address: string): Promise<RoleInfo[]> {
    try {
      const allRoles = Object.values(SystemRole);
      const roleInfos: RoleInfo[] = [];

      for (const roleName of allRoles) {
        const roleHash = this.getRoleHash(roleName);
        const hasRole = await this.token.hasRole(roleHash, address);

        roleInfos.push({
          roleName,
          roleHash,
          hasRole
        });
      }

      return roleInfos;
    } catch (error: any) {
      console.error(`Erro ao listar roles para ${address}:`, error.message);
      throw new Error(`Falha ao listar roles: ${error.message}`);
    }
  }

  /**
   * Concede uma role para um endereço
   */
  async grantRole(roleName: string, address: string): Promise<RoleOperationResult> {
    try {
      console.log(`[RoleManager] Concedendo ${roleName} para ${address}...`);

      const roleHash = this.getRoleHash(roleName);

      // Verificar se já tem a role
      const hasRole = await this.token.hasRole(roleHash, address);
      if (hasRole) {
        console.log(`[RoleManager] ${address} já possui ${roleName}`);
        return {
          success: true,
          roleName,
          roleHash,
          address,
          alreadyGranted: true
        };
      }

      // Verificar se o admin tem permissão para conceder essa role
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      const isAdmin = await this.token.hasRole(DEFAULT_ADMIN_ROLE, this.adminWallet.address);

      if (!isAdmin) {
        throw new Error('Admin wallet não tem permissão DEFAULT_ADMIN_ROLE');
      }

      // Conceder role
      const tx = await this.token.grantRole(roleHash, address, {
        type: 0,
        gasLimit: 100000,
        gasPrice: 1000
      });

      console.log(`[RoleManager] Aguardando confirmação... TX: ${tx.hash}`);
      const receipt = await tx.wait();

      // Verificar se foi concedida corretamente
      const verifyHasRole = await this.token.hasRole(roleHash, address);
      if (!verifyHasRole) {
        throw new Error('Role não foi concedida corretamente');
      }

      console.log(`[RoleManager] ${roleName} concedida com sucesso!`);

      return {
        success: true,
        roleName,
        roleHash,
        address,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        alreadyGranted: false
      };

    } catch (error: any) {
      console.error(`[RoleManager] Erro ao conceder ${roleName}:`, error.message);
      return {
        success: false,
        roleName,
        roleHash: this.getRoleHash(roleName),
        address,
        error: error.message
      };
    }
  }

  /**
   * Revoga uma role de um endereço
   */
  async revokeRole(roleName: string, address: string): Promise<RoleOperationResult> {
    try {
      console.log(`[RoleManager] Revogando ${roleName} de ${address}...`);

      const roleHash = this.getRoleHash(roleName);

      // Verificar se tem a role
      const hasRole = await this.token.hasRole(roleHash, address);
      if (!hasRole) {
        console.log(`[RoleManager] ${address} não possui ${roleName}`);
        return {
          success: true,
          roleName,
          roleHash,
          address,
          alreadyGranted: false
        };
      }

      // Verificar se o admin tem permissão
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      const isAdmin = await this.token.hasRole(DEFAULT_ADMIN_ROLE, this.adminWallet.address);

      if (!isAdmin) {
        throw new Error('Admin wallet não tem permissão DEFAULT_ADMIN_ROLE');
      }

      // Revogar role
      const tx = await this.token.revokeRole(roleHash, address, {
        type: 0,
        gasLimit: 100000,
        gasPrice: 1000
      });

      console.log(`[RoleManager] Aguardando confirmação... TX: ${tx.hash}`);
      const receipt = await tx.wait();

      // Verificar se foi revogada corretamente
      const verifyHasRole = await this.token.hasRole(roleHash, address);
      if (verifyHasRole) {
        throw new Error('Role não foi revogada corretamente');
      }

      console.log(`[RoleManager] ${roleName} revogada com sucesso!`);

      return {
        success: true,
        roleName,
        roleHash,
        address,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        alreadyGranted: false
      };

    } catch (error: any) {
      console.error(`[RoleManager] Erro ao revogar ${roleName}:`, error.message);
      return {
        success: false,
        roleName,
        roleHash: this.getRoleHash(roleName),
        address,
        error: error.message
      };
    }
  }

  /**
   * Concede as 3 roles institucionais para um endereço
   * Útil para desenvolvimento/testes
   */
  async grantAllInstitutionalRoles(address: string): Promise<RoleOperationResult[]> {
    console.log(`[RoleManager] Concedendo todas as roles institucionais para ${address}...`);

    const results: RoleOperationResult[] = [];

    results.push(await this.grantRole(SystemRole.FINANCIAL, address));
    results.push(await this.grantRole(SystemRole.REGISTRY_OFFICE, address));
    results.push(await this.grantRole(SystemRole.MUNICIPALITY, address));

    const allSuccess = results.every(r => r.success);
    console.log(`[RoleManager] Resultado: ${allSuccess ? 'Sucesso' : 'Falha parcial'}`);

    return results;
  }

  /**
   * Verifica se o admin tem permissões adequadas
   */
  async verifyAdminPermissions(): Promise<{
    isAdmin: boolean;
    address: string;
    roles: RoleInfo[];
  }> {
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    const isAdmin = await this.token.hasRole(DEFAULT_ADMIN_ROLE, this.adminWallet.address);
    const roles = await this.getRolesForAddress(this.adminWallet.address);

    return {
      isAdmin,
      address: this.adminWallet.address,
      roles: roles.filter(r => r.hasRole)
    };
  }

  /**
   * Lista todos os endereços com uma role específica
   * Nota: Requer parsear eventos do contrato, pois não há método direto
   */
  async getAddressesWithRole(roleName: string): Promise<string[]> {
    try {
      const roleHash = this.getRoleHash(roleName);

      // Buscar eventos RoleGranted do contrato
      const filter = this.token.filters.RoleGranted(roleHash, null, null);
      const events = await this.token.queryFilter(filter);

      // Extrair endereços únicos que receberam a role
      const addresses = new Set<string>();

      for (const event of events) {
        // Type guard: verificar se é EventLog (tem args)
        if ('args' in event && event.args && event.args.account) {
          const address = event.args.account as string;

          // Verificar se ainda tem a role (pode ter sido revogada)
          const hasRole = await this.token.hasRole(roleHash, address);
          if (hasRole) {
            addresses.add(address);
          }
        }
      }

      return Array.from(addresses);
    } catch (error: any) {
      console.error(`Erro ao listar endereços com role ${roleName}:`, error.message);
      throw new Error(`Falha ao listar endereços: ${error.message}`);
    }
  }

  /**
   * Retorna informações sobre o contrato e admin
   */
  getContractInfo(): {
    tokenAddress: string;
    adminAddress: string;
    rpcUrl: string;
  } {
    return {
      tokenAddress: process.env.TOKEN_ADDRESS!,
      adminAddress: this.adminWallet.address,
      rpcUrl: process.env.RPC_URL!
    };
  }
}
