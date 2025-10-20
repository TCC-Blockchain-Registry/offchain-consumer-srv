import { ethers } from 'ethers';
import {
  getPropertyTitleWithSigner,
  getRegistryModuleWithSigner,
  propertyTitleContract,
  ADDRESSES
} from '../config/contracts';
import { adminWallet } from '../config/blockchain';

// Tipos baseados no smart contract RegistryMDCompliance
export enum PropertyType {
  URBANO = 0,
  RURAL = 1,
  LITORAL = 2
}

export interface PropertyInfo {
  matriculaId: number;
  folha: number;
  comarca: string;
  endereco: string;
  metragem: number;
  proprietario: string;
  matriculaOrigem: number;
  tipo: PropertyType;
  isRegular: boolean;
}

export class PropertyService {
  
  /**
   * PASSO 1: Registrar propriedade no módulo de compliance (RegistryMDCompliance)
   * Executado com REGISTRAR_ROLE (cartório)
   */
  async registerPropertyInCompliance(propertyInfo: PropertyInfo): Promise<string> {
    try {
      console.log(`📝 Registrando propriedade ${propertyInfo.matriculaId} no módulo de compliance...`);
      
      // Usar adminWallet pois tem saldo (registrarWallet não foi financiado)
      const registryModule = getRegistryModuleWithSigner(adminWallet);
      
      // Chamar função registerProperty com struct PropertyInfo
      const tx = await registryModule.registerProperty(
        {
          matriculaId: propertyInfo.matriculaId,
          folha: propertyInfo.folha,
          comarca: propertyInfo.comarca,
          endereco: propertyInfo.endereco,
          metragem: propertyInfo.metragem,
          proprietario: propertyInfo.proprietario,
          matriculaOrigem: propertyInfo.matriculaOrigem,
          tipo: propertyInfo.tipo,
          isRegular: propertyInfo.isRegular
        },
        {
          type: 0,
          gasLimit: 300000,
          gasPrice: 1000
        }
      );
      
      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      const receipt = await tx.wait();
      
      console.log(`✅ Propriedade registrada no compliance! Block: ${receipt.blockNumber}`);
      return tx.hash;
      
    } catch (error: any) {
      console.error('❌ Erro ao registrar no compliance:', error);
      throw new Error(`Falha ao registrar no compliance: ${error.message}`);
    }
  }
  
  /**
   * PASSO 2: Emitir título de propriedade (mint token no PropertyTitleTREX)
   * Executado com AGENT_ROLE (admin)
   */
  async issuePropertyTitle(ownerAddress: string, matriculaId: number): Promise<string> {
    try {
      console.log(`🏠 Emitindo título de propriedade para matrícula ${matriculaId}...`);
      
      const propertyTitle = getPropertyTitleWithSigner(adminWallet);
      
      const tx = await propertyTitle.issueProperty(
        ownerAddress,
        matriculaId,
        {
          type: 0,
          gasLimit: 250000,
          gasPrice: 1000
        }
      );
      
      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      const receipt = await tx.wait();
      
      console.log(`✅ Título emitido! Block: ${receipt.blockNumber}`);
      
      // Buscar evento PropertyIssued
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = propertyTitle.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          return parsed?.name === 'PropertyIssued';
        } catch {
          return false;
        }
      });
      
      if (event) {
        console.log(`📋 Matrícula: ${matriculaId}, Proprietário: ${ownerAddress}`);
      }
      
      return tx.hash;
      
    } catch (error: any) {
      console.error('❌ Erro ao emitir título:', error);
      throw new Error(`Falha ao emitir título: ${error.message}`);
    }
  }
  
  /**
   * Helper: Registrar identidade do proprietário no IdentityRegistry (se necessário)
   * O proprietário precisa ter identidade registrada para receber tokens
   */
  private async ensureOwnerIdentity(ownerAddress: string): Promise<void> {
    try {
      const { ethers } = await import('ethers');
      const IdentityRegistryABI = (await import('../abis/IdentityRegistry.json')).default;
      const identityRegistry = new ethers.Contract(
        ADDRESSES.identityRegistry,
        IdentityRegistryABI,
        adminWallet
      );
      
      // Verificar se já está registrado
      const isRegistered = await identityRegistry.isVerified(ownerAddress);
      
      if (!isRegistered) {
        console.log(`📝 Registrando identidade do proprietário ${ownerAddress}...`);
        
        // Registrar com identidade zero (simplificado para desenvolvimento)
        const tx = await identityRegistry.registerIdentity(
          ownerAddress,
          ethers.ZeroAddress, // Identity contract
          76, // Country code: Brasil
          {
            type: 0,
            gasLimit: 300000,
            gasPrice: 1000
          }
        );
        
        await tx.wait();
        console.log(`✅ Identidade registrada!`);
      } else {
        console.log(`✅ Proprietário já tem identidade registrada`);
      }
    } catch (error: any) {
      console.warn(`⚠️ Aviso ao registrar identidade: ${error.message}`);
      // Não falhar completamente - pode já estar registrado
    }
  }

  /**
   * FLUXO COMPLETO: Registrar no compliance + Emitir título
   * Este é o endpoint principal para registrar um imóvel
   */
  async registerProperty(propertyInfo: PropertyInfo): Promise<{
    complianceTxHash: string;
    issueTxHash: string;
    matriculaId: number;
    owner: string;
  }> {
    console.log(`🚀 Iniciando registro completo do imóvel ${propertyInfo.matriculaId}...`);
    
    try {
      // Passo 0: Garantir que proprietário tem identidade registrada
      await this.ensureOwnerIdentity(propertyInfo.proprietario);
      
      // Passo 1: Registrar no compliance
      const complianceTxHash = await this.registerPropertyInCompliance(propertyInfo);
      
      // Aguardar um pouco para garantir propagação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Passo 2: Emitir título
      const issueTxHash = await this.issuePropertyTitle(
        propertyInfo.proprietario,
        propertyInfo.matriculaId
      );
      
      console.log(`✅ Registro completo finalizado!`);
      console.log(`   - Compliance TX: ${complianceTxHash}`);
      console.log(`   - Issue TX: ${issueTxHash}`);
      
      return {
        complianceTxHash,
        issueTxHash,
        matriculaId: propertyInfo.matriculaId,
        owner: propertyInfo.proprietario
      };
      
    } catch (error: any) {
      console.error('❌ Erro no registro completo:', error);
      throw error;
    }
  }
  
  /**
   * Consultar propriedade no módulo de compliance
   */
  async getPropertyFromCompliance(matriculaId: number): Promise<PropertyInfo> {
    try {
      const registryModule = getRegistryModuleWithSigner(adminWallet);
      const property = await registryModule.getProperty(matriculaId);
      
      return {
        matriculaId: Number(property.matriculaId),
        folha: Number(property.folha),
        comarca: property.comarca,
        endereco: property.endereco,
        metragem: Number(property.metragem),
        proprietario: property.proprietario,
        matriculaOrigem: Number(property.matriculaOrigem),
        tipo: Number(property.tipo),
        isRegular: property.isRegular
      };
    } catch (error: any) {
      throw new Error(`Propriedade não encontrada: ${error.message}`);
    }
  }
  
  /**
   * Listar todas as propriedades de um dono (do token)
   */
  async getPropertiesOfOwner(ownerAddress: string): Promise<number[]> {
    try {
      const matriculas = await propertyTitleContract.getPropertiesOf(ownerAddress);
      return matriculas.map((m: bigint) => Number(m));
    } catch (error: any) {
      throw new Error(`Erro ao buscar propriedades: ${error.message}`);
    }
  }
  
  /**
   * Verificar quem é o dono atual de uma propriedade
   */
  async getPropertyOwner(matriculaId: number): Promise<string> {
    try {
      return await propertyTitleContract.getPropertyOwner(matriculaId);
    } catch (error: any) {
      throw new Error(`Erro ao buscar dono: ${error.message}`);
    }
  }
  
  /**
   * Verificar se propriedade existe
   */
  async propertyExists(matriculaId: number): Promise<boolean> {
    try {
      return await propertyTitleContract.propertyExists(matriculaId);
    } catch (error: any) {
      throw new Error(`Erro ao verificar existência: ${error.message}`);
    }
  }
  
  /**
   * Verificar se propriedade está congelada
   */
  async isPropertyFrozen(matriculaId: number): Promise<boolean> {
    try {
      return await propertyTitleContract.isPropertyFrozen(matriculaId);
    } catch (error: any) {
      throw new Error(`Erro ao verificar freeze: ${error.message}`);
    }
  }
  
  /**
   * Obter informações completas de uma propriedade
   * (combina dados do compliance + token)
   */
  async getPropertyDetails(matriculaId: number): Promise<{
    complianceInfo: PropertyInfo;
    owner: string;
    exists: boolean;
    frozen: boolean;
  }> {
    try {
      const [complianceInfo, owner, exists, frozen] = await Promise.all([
        this.getPropertyFromCompliance(matriculaId),
        this.getPropertyOwner(matriculaId),
        this.propertyExists(matriculaId),
        this.isPropertyFrozen(matriculaId)
      ]);
      
      return {
        complianceInfo,
        owner,
        exists,
        frozen
      };
    } catch (error: any) {
      throw new Error(`Erro ao buscar detalhes: ${error.message}`);
    }
  }
  
  /**
   * Atualizar informações cadastrais de uma propriedade
   */
  async updateProperty(
    matriculaId: number,
    endereco: string,
    metragem: number,
    isRegular: boolean
  ): Promise<string> {
    try {
      console.log(`📝 Atualizando propriedade ${matriculaId}...`);
      
      const registryModule = getRegistryModuleWithSigner(adminWallet);
      
      const tx = await registryModule.updateProperty(
        matriculaId,
        endereco,
        metragem,
        isRegular,
        {
          type: 0,
          gasLimit: 200000,
          gasPrice: 1000
        }
      );
      
      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();
      
      console.log(`✅ Propriedade atualizada!`);
      return tx.hash;
      
    } catch (error: any) {
      console.error('❌ Erro ao atualizar:', error);
      throw new Error(`Falha ao atualizar: ${error.message}`);
    }
  }
}

