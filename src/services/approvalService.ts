import { ethers } from 'ethers';
import {
  getPropertyTitleWithSigner,
  propertyTitleContract
} from '../config/contracts';
import { adminWallet, createWallet } from '../config/blockchain';

export class ApprovalService {

  /**
   * Instituição Financeira aprova transferência
   * Requer FINANCIAL_ROLE
   */
  async approveAsFinancial(
    from: string,
    to: string,
    matricula: number,
    privateKey?: string
  ): Promise<string> {
    try {
      console.log(`💰 IF aprovando transferência da matrícula ${matricula}...`);
      console.log(`   De: ${from} → Para: ${to}`);

      const wallet = privateKey ? createWallet(privateKey) : adminWallet;
      const propertyTitle = getPropertyTitleWithSigner(wallet);

      const tx = await propertyTitle.approveTransferAsFinancial(
        from,
        to,
        matricula,
        {
          type: 0,
          gasLimit: 200000,
          gasPrice: 1000
        }
      );

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Aprovação financeira registrada!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao aprovar como IF:', error);
      throw new Error(`Falha na aprovação financeira: ${error.message}`);
    }
  }

  /**
   * Cartório aprova transferência
   * Requer REGISTRY_OFFICE_ROLE
   */
  async approveAsRegistryOffice(
    from: string,
    to: string,
    matricula: number,
    privateKey?: string
  ): Promise<string> {
    try {
      console.log(`📋 Cartório aprovando transferência da matrícula ${matricula}...`);
      console.log(`   De: ${from} → Para: ${to}`);

      const wallet = privateKey ? createWallet(privateKey) : adminWallet;
      const propertyTitle = getPropertyTitleWithSigner(wallet);

      const tx = await propertyTitle.approveTransferAsRegistryOffice(
        from,
        to,
        matricula,
        {
          type: 0,
          gasLimit: 200000,
          gasPrice: 1000
        }
      );

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Aprovação do cartório registrada!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao aprovar como cartório:', error);
      throw new Error(`Falha na aprovação do cartório: ${error.message}`);
    }
  }

  /**
   * Prefeitura aprova transferência
   * Requer MUNICIPALITY_ROLE
   */
  async approveAsMunicipality(
    from: string,
    to: string,
    matricula: number,
    privateKey?: string
  ): Promise<string> {
    try {
      console.log(`🏛️ Prefeitura aprovando transferência da matrícula ${matricula}...`);
      console.log(`   De: ${from} → Para: ${to}`);

      const wallet = privateKey ? createWallet(privateKey) : adminWallet;
      const propertyTitle = getPropertyTitleWithSigner(wallet);

      const tx = await propertyTitle.approveTransferAsMunicipality(
        from,
        to,
        matricula,
        {
          type: 0,
          gasLimit: 200000,
          gasPrice: 1000
        }
      );

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Aprovação da prefeitura registrada!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao aprovar como prefeitura:', error);
      throw new Error(`Falha na aprovação da prefeitura: ${error.message}`);
    }
  }

  /**
   * Configurar validador da Instituição Financeira
   * Requer DEFAULT_ADMIN_ROLE
   */
  async setFinancialValidator(validatorAddress: string): Promise<string> {
    try {
      console.log(`⚙️ Configurando validador da IF: ${validatorAddress}...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.setFinancialValidator(
        validatorAddress,
        {
          type: 0,
          gasLimit: 150000,
          gasPrice: 1000
        }
      );

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Validador da IF configurado!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao configurar validador da IF:', error);
      throw new Error(`Falha ao configurar validador: ${error.message}`);
    }
  }

  /**
   * Configurar validador do Cartório
   * Requer DEFAULT_ADMIN_ROLE
   */
  async setRegistryOfficeValidator(validatorAddress: string): Promise<string> {
    try {
      console.log(`⚙️ Configurando validador do cartório: ${validatorAddress}...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.setRegistryOfficeValidator(
        validatorAddress,
        {
          type: 0,
          gasLimit: 150000,
          gasPrice: 1000
        }
      );

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Validador do cartório configurado!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao configurar validador do cartório:', error);
      throw new Error(`Falha ao configurar validador: ${error.message}`);
    }
  }

  /**
   * Configurar validador da Prefeitura
   * Requer DEFAULT_ADMIN_ROLE
   */
  async setMunicipalityValidator(validatorAddress: string): Promise<string> {
    try {
      console.log(`⚙️ Configurando validador da prefeitura: ${validatorAddress}...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.setMunicipalityValidator(
        validatorAddress,
        {
          type: 0,
          gasLimit: 150000,
          gasPrice: 1000
        }
      );

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Validador da prefeitura configurado!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao configurar validador da prefeitura:', error);
      throw new Error(`Falha ao configurar validador: ${error.message}`);
    }
  }

  /**
   * Obter endereço do validador da IF
   */
  async getFinancialValidator(): Promise<string> {
    try {
      return await propertyTitleContract.financialValidator();
    } catch (error: any) {
      throw new Error(`Erro ao buscar validador da IF: ${error.message}`);
    }
  }

  /**
   * Obter endereço do validador do Cartório
   */
  async getRegistryOfficeValidator(): Promise<string> {
    try {
      return await propertyTitleContract.registryOfficeValidator();
    } catch (error: any) {
      throw new Error(`Erro ao buscar validador do cartório: ${error.message}`);
    }
  }

  /**
   * Obter endereço do validador da Prefeitura
   */
  async getMunicipalityValidator(): Promise<string> {
    try {
      return await propertyTitleContract.municipalityValidator();
    } catch (error: any) {
      throw new Error(`Erro ao buscar validador da prefeitura: ${error.message}`);
    }
  }
}
