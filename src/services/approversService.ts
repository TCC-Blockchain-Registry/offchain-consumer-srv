import { ethers } from 'ethers';
import {
  getApproversRegistryWithSigner,
  approversRegistryContract
} from '../config/contracts';
import { adminWallet } from '../config/blockchain';

// Enum de tipos de aprovadores (igual ao smart contract)
export enum ApproverType {
  CARTORIO = 0,
  PREFEITURA = 1,
  INSTITUICAO_FINANCEIRA = 2
}

export interface ApproverInfo {
  wallet: string;
  approverType: ApproverType;
  name: string;
  document: string;
  active: boolean;
  registeredAt: number;
}

export class ApproversService {
  
  /**
   * Registrar um novo aprovador no sistema
   * Apenas ADMIN pode chamar
   */
  async registerApprover(
    wallet: string,
    approverType: ApproverType,
    name: string,
    document: string
  ): Promise<string> {
    try {
      console.log(`📝 Registrando aprovador: ${name} (${ApproverType[approverType]})...`);
      
      const registry = getApproversRegistryWithSigner(adminWallet);
      
      const tx = await registry.registerApprover(
        wallet,
        approverType,
        name,
        document,
        {
          gasLimit: 300000,
          gasPrice: 1000,
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined
        }
      );
      
      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();
      
      console.log(`✅ Aprovador registrado!`);
      return tx.hash;
      
    } catch (error: any) {
      console.error('❌ Erro ao registrar aprovador:', error);
      throw new Error(`Falha ao registrar aprovador: ${error.message}`);
    }
  }
  
  /**
   * Verificar se um endereço é um aprovador válido
   */
  async isValidApprover(wallet: string): Promise<boolean> {
    try {
      return await approversRegistryContract.isValidApprover(wallet);
    } catch (error: any) {
      throw new Error(`Erro ao verificar aprovador: ${error.message}`);
    }
  }
  
  /**
   * Verificar se é aprovador de um tipo específico
   */
  async isApproverOfType(
    wallet: string,
    approverType: ApproverType
  ): Promise<boolean> {
    try {
      return await approversRegistryContract.isApproverOfType(wallet, approverType);
    } catch (error: any) {
      throw new Error(`Erro ao verificar tipo: ${error.message}`);
    }
  }
  
  /**
   * Obter informações completas de um aprovador
   */
  async getApproverInfo(wallet: string): Promise<ApproverInfo> {
    try {
      const info = await approversRegistryContract.getApproverInfo(wallet);
      
      return {
        wallet: info[0],
        approverType: Number(info[1]),
        name: info[2],
        document: info[3],
        active: info[4],
        registeredAt: Number(info[5])
      };
    } catch (error: any) {
      throw new Error(`Erro ao buscar informações: ${error.message}`);
    }
  }
  
  /**
   * Listar todos os aprovadores registrados
   */
  async getAllApprovers(): Promise<string[]> {
    try {
      return await approversRegistryContract.getAllApprovers();
    } catch (error: any) {
      throw new Error(`Erro ao listar aprovadores: ${error.message}`);
    }
  }
  
  /**
   * Listar apenas aprovadores ativos
   */
  async getActiveApprovers(): Promise<string[]> {
    try {
      return await approversRegistryContract.getActiveApprovers();
    } catch (error: any) {
      throw new Error(`Erro ao listar ativos: ${error.message}`);
    }
  }
  
  /**
   * Listar aprovadores por tipo
   */
  async getApproversByType(approverType: ApproverType): Promise<string[]> {
    try {
      return await approversRegistryContract.getApproversByType(approverType);
    } catch (error: any) {
      throw new Error(`Erro ao listar por tipo: ${error.message}`);
    }
  }
  
  /**
   * Validar se uma lista de aprovadores são todos válidos
   * Útil antes de configurar uma transferência
   */
  async validateApprovers(approverAddresses: string[]): Promise<boolean> {
    try {
      return await approversRegistryContract.validateApprovers(approverAddresses);
    } catch (error: any) {
      throw new Error(`Erro ao validar lista: ${error.message}`);
    }
  }
  
  /**
   * Desativar um aprovador
   */
  async deactivateApprover(wallet: string): Promise<string> {
    try {
      console.log(`🚫 Desativando aprovador: ${wallet}...`);
      
      const registry = getApproversRegistryWithSigner(adminWallet);
      
      const tx = await registry.deactivateApprover(wallet, {
        type: 0,
        gasLimit: 150000,
        gasPrice: 1000
      });
      
      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();
      
      console.log(`✅ Aprovador desativado!`);
      return tx.hash;
      
    } catch (error: any) {
      console.error('❌ Erro ao desativar:', error);
      throw new Error(`Falha ao desativar: ${error.message}`);
    }
  }
  
  /**
   * Reativar um aprovador
   */
  async reactivateApprover(wallet: string): Promise<string> {
    try {
      console.log(`✅ Reativando aprovador: ${wallet}...`);
      
      const registry = getApproversRegistryWithSigner(adminWallet);
      
      const tx = await registry.reactivateApprover(wallet, {
        type: 0,
        gasLimit: 150000,
        gasPrice: 1000
      });
      
      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();
      
      console.log(`✅ Aprovador reativado!`);
      return tx.hash;
      
    } catch (error: any) {
      console.error('❌ Erro ao reativar:', error);
      throw new Error(`Falha ao reativar: ${error.message}`);
    }
  }
  
  /**
   * Obter aprovadores recomendados para uma transferência
   * Retorna 1 de cada tipo (CARTORIO, PREFEITURA, IF) se disponíveis
   */
  async getRecommendedApprovers(): Promise<{
    cartorio?: string;
    prefeitura?: string;
    instituicaoFinanceira?: string;
  }> {
    try {
      const result: any = {};
      
      // Buscar cartório
      const cartorios = await this.getApproversByType(ApproverType.CARTORIO);
      if (cartorios.length > 0) {
        // Verificar se está ativo
        const info = await this.getApproverInfo(cartorios[0]);
        if (info.active) {
          result.cartorio = cartorios[0];
        }
      }
      
      // Buscar prefeitura
      const prefeituras = await this.getApproversByType(ApproverType.PREFEITURA);
      if (prefeituras.length > 0) {
        const info = await this.getApproverInfo(prefeituras[0]);
        if (info.active) {
          result.prefeitura = prefeituras[0];
        }
      }
      
      // Buscar IF
      const ifs = await this.getApproversByType(ApproverType.INSTITUICAO_FINANCEIRA);
      if (ifs.length > 0) {
        const info = await this.getApproverInfo(ifs[0]);
        if (info.active) {
          result.instituicaoFinanceira = ifs[0];
        }
      }
      
      return result;
      
    } catch (error: any) {
      throw new Error(`Erro ao buscar recomendados: ${error.message}`);
    }
  }
}

