import { ethers } from 'ethers';
const PropertyTitleABI = require('../abis/PropertyTitleTREX.json');
import {
  getRegistryModuleWithSigner,
  propertyTitleContract
} from '../config/contracts';
import { adminWallet } from '../config/blockchain';
import { identityService } from './identityService';

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

// Tipos baseados no smart contract
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

/**
 * PropertyService - Gerencia registro e consulta de propriedades
 */
export class PropertyService {
  private provider: LegacyProvider;
  private adminWallet: ethers.Wallet;
  private propertyContract: ethers.Contract;

  constructor() {
    this.provider = new LegacyProvider(process.env.RPC_URL!, {
      chainId: Number(process.env.CHAIN_ID) || 1337,
      name: 'besu-private',
    });

    this.adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, this.provider);

    this.propertyContract = new ethers.Contract(
      process.env.PROPERTY_TITLE_ADDRESS!,
      PropertyTitleABI.abi || PropertyTitleABI,
      this.adminWallet
    );
  }

  /**
   * Solicita registro de propriedade (fica pendente até aprovações)
   */
  async requestPropertyRegistration(matriculaId: number, beneficiary: string): Promise<{
    success: boolean;
    requestHash: string;
    txHash: string;
    blockNumber: number;
  }> {
    try {
      console.log(`🏠 Solicitando registro de propriedade ${matriculaId}...`);
      console.log(`   Beneficiário: ${beneficiary}`);

      // Garantir que o beneficiário tem identidade registrada
      await identityService.ensureIdentityRegistered(beneficiary);

      const tx = await this.propertyContract.requestPropertyRegistration(
        matriculaId,
        beneficiary,
        {
          type: 0,
          gasLimit: 500000,
          gasPrice: 1000
        }
      );

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      const receipt = await tx.wait();

      // Extrair requestHash do evento RegistrationRequested
      const event = receipt.logs
        .map((log: any) => {
          try {
            return this.propertyContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e?.name === 'RegistrationRequested');

      if (!event) {
        throw new Error('RegistrationRequested event not found');
      }

      const requestHash = event.args.requestHash;

      console.log(`✅ Solicitação criada!`);
      console.log(`   Request Hash: ${requestHash}`);
      console.log(`   Block: ${receipt.blockNumber}`);

      return {
        success: true,
        requestHash,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error: any) {
      console.error(`❌ Erro ao solicitar registro:`, error.message);
      throw new Error(`Falha ao solicitar registro: ${error.message}`);
    }
  }

  /**
   * Aprova registro como Instituição Financeira
   */
  async approveAsFinancial(requestHash: string): Promise<{
    success: boolean;
    txHash: string;
  }> {
    try {
      console.log(`💰 Aprovando registro como Instituição Financeira...`);
      console.log(`   Request Hash: ${requestHash}`);

      const tx = await this.propertyContract.approveRegistrationAsFinancial(
        requestHash,
        {
          type: 0,
          gasLimit: 200000,
          gasPrice: 1000
        }
      );

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Aprovado pela Instituição Financeira!`);

      return {
        success: true,
        txHash: tx.hash
      };

    } catch (error: any) {
      console.error(`❌ Erro ao aprovar (financial):`, error.message);
      throw new Error(`Falha na aprovação financeira: ${error.message}`);
    }
  }

  /**
   * Aprova registro como Cartório
   */
  async approveAsRegistryOffice(requestHash: string): Promise<{
    success: boolean;
    txHash: string;
  }> {
    try {
      console.log(`📋 Aprovando registro como Cartório...`);
      console.log(`   Request Hash: ${requestHash}`);

      const tx = await this.propertyContract.approveRegistrationAsRegistryOffice(
        requestHash,
        {
          type: 0,
          gasLimit: 200000,
          gasPrice: 1000
        }
      );

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Aprovado pelo Cartório!`);

      return {
        success: true,
        txHash: tx.hash
      };

    } catch (error: any) {
      console.error(`❌ Erro ao aprovar (registry):`, error.message);
      throw new Error(`Falha na aprovação do cartório: ${error.message}`);
    }
  }

  /**
   * Aprova registro como Prefeitura (auto-executa quando última aprovação)
   */
  async approveAsMunicipality(requestHash: string): Promise<{
    success: boolean;
    txHash: string;
  }> {
    try {
      console.log(`🏛️ Aprovando registro como Prefeitura...`);
      console.log(`   Request Hash: ${requestHash}`);

      const tx = await this.propertyContract.approveRegistrationAsMunicipality(
        requestHash,
        {
          type: 0,
          gasLimit: 200000,
          gasPrice: 1000
        }
      );

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Aprovado pela Prefeitura (auto-executado)!`);

      return {
        success: true,
        txHash: tx.hash
      };

    } catch (error: any) {
      console.error(`❌ Erro ao aprovar (municipality):`, error.message);
      throw new Error(`Falha na aprovação da prefeitura: ${error.message}`);
    }
  }

  /**
   * Consulta status de um registro pendente
   * NOTA: A execução é AUTOMÁTICA quando todas as 3 aprovações são recebidas
   */
  async getRegistrationStatus(requestHash: string): Promise<{
    exists: boolean;
    matricula: number;
    beneficiary: string;
    financialApproved: boolean;
    registryOfficeApproved: boolean;
    municipalityApproved: boolean;
    executed: boolean;
  }> {
    try {
      const registration = await this.propertyContract.pendingRegistrations(requestHash);

      return {
        exists: registration.exists,
        matricula: Number(registration.matricula),
        beneficiary: registration.beneficiary,
        financialApproved: registration.financialApproved,
        registryOfficeApproved: registration.registryOfficeApproved,
        municipalityApproved: registration.municipalityApproved,
        executed: registration.executed
      };

    } catch (error: any) {
      console.error(`❌ Erro ao consultar status:`, error.message);
      throw new Error(`Falha ao consultar status: ${error.message}`);
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
      return await propertyTitleContract.propertyOwner(matriculaId);
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
   * Obter informações completas de uma propriedade
   */
  async getPropertyDetails(matriculaId: number): Promise<{
    complianceInfo: PropertyInfo | null;
    owner: string;
    exists: boolean;
  }> {
    try {
      // Primeiro verificar se a propriedade existe no token
      const exists = await this.propertyExists(matriculaId);

      if (!exists) {
        throw new Error(`Propriedade ${matriculaId} não está registrada no token`);
      }

      // Buscar owner (sempre existe se a propriedade existe)
      const owner = await this.getPropertyOwner(matriculaId);

      // Tentar buscar dados de compliance (pode não existir)
      let complianceInfo: PropertyInfo | null = null;
      try {
        complianceInfo = await this.getPropertyFromCompliance(matriculaId);
      } catch (error: any) {
        console.warn(`⚠️  Propriedade ${matriculaId} não tem dados de compliance: ${error.message}`);
        // Não falha - apenas retorna null para complianceInfo
      }

      return {
        complianceInfo,
        owner,
        exists
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

  /**
   * Contar quantas propriedades um endereço possui
   */
  async propertyCountOf(ownerAddress: string): Promise<number> {
    try {
      const count = await propertyTitleContract.balanceOfProperties(ownerAddress);
      return Number(count);
    } catch (error: any) {
      throw new Error(`Erro ao contar propriedades: ${error.message}`);
    }
  }
}

export const propertyService = new PropertyService();
