import { ethers } from 'ethers';
const PropertyTitleABI = require('../abis/PropertyTitleTREX.json');

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
 * PropertyService V2 - Suporta novo fluxo com aprovações
 */
export class PropertyServiceV2 {
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
  async approveRegistrationAsFinancial(requestHash: string): Promise<{
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
  async approveRegistrationAsRegistryOffice(requestHash: string): Promise<{
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
   * Aprova registro como Prefeitura
   */
  async approveRegistrationAsMunicipality(requestHash: string): Promise<{
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

      console.log(`✅ Aprovado pela Prefeitura!`);

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
   * Executa o registro após todas as aprovações
   */
  async executeRegistration(requestHash: string): Promise<{
    success: boolean;
    txHash: string;
    blockNumber: number;
  }> {
    try {
      console.log(`⚡ Executando registro...`);
      console.log(`   Request Hash: ${requestHash}`);

      const tx = await this.propertyContract.executeRegistration(
        requestHash,
        {
          type: 0,
          gasLimit: 500000,
          gasPrice: 1000
        }
      );

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      const receipt = await tx.wait();

      console.log(`✅ Registro executado com sucesso!`);
      console.log(`   Block: ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error: any) {
      console.error(`❌ Erro ao executar registro:`, error.message);
      throw new Error(`Falha ao executar registro: ${error.message}`);
    }
  }

  /**
   * Consulta status de um registro pendente
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
   * Solicita transferência de propriedade (fica pendente até aprovações)
   */
  async requestPropertyTransfer(from: string, to: string, matriculaId: number): Promise<{
    success: boolean;
    requestHash: string;
    txHash: string;
    blockNumber: number;
  }> {
    try {
      console.log(`🔄 Solicitando transferência de propriedade ${matriculaId}...`);
      console.log(`   De: ${from}`);
      console.log(`   Para: ${to}`);

      const tx = await this.propertyContract.requestPropertyTransfer(
        from,
        to,
        matriculaId,
        {
          type: 0,
          gasLimit: 500000,
          gasPrice: 1000
        }
      );

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      const receipt = await tx.wait();

      // Extrair requestHash do evento TransferRequested
      const event = receipt.logs
        .map((log: any) => {
          try {
            return this.propertyContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e?.name === 'TransferRequested');

      if (!event) {
        throw new Error('TransferRequested event not found');
      }

      const requestHash = event.args.requestHash;

      console.log(`✅ Solicitação de transferência criada!`);
      console.log(`   Request Hash: ${requestHash}`);

      return {
        success: true,
        requestHash,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error: any) {
      console.error(`❌ Erro ao solicitar transferência:`, error.message);
      throw new Error(`Falha ao solicitar transferência: ${error.message}`);
    }
  }

  /**
   * Aprova transferência como Instituição Financeira
   */
  async approveTransferAsFinancial(requestHash: string): Promise<{
    success: boolean;
    txHash: string;
  }> {
    try {
      console.log(`💰 Aprovando transferência como Instituição Financeira...`);

      const tx = await this.propertyContract.approveTransferAsFinancial(
        requestHash,
        {
          type: 0,
          gasLimit: 200000,
          gasPrice: 1000
        }
      );

      await tx.wait();
      console.log(`✅ Transferência aprovada pela Instituição Financeira!`);

      return { success: true, txHash: tx.hash };

    } catch (error: any) {
      throw new Error(`Falha na aprovação financeira: ${error.message}`);
    }
  }

  /**
   * Aprova transferência como Cartório
   */
  async approveTransferAsRegistryOffice(requestHash: string): Promise<{
    success: boolean;
    txHash: string;
  }> {
    try {
      const tx = await this.propertyContract.approveTransferAsRegistryOffice(requestHash, {
        type: 0,
        gasLimit: 200000,
        gasPrice: 1000
      });

      await tx.wait();
      return { success: true, txHash: tx.hash };

    } catch (error: any) {
      throw new Error(`Falha na aprovação do cartório: ${error.message}`);
    }
  }

  /**
   * Aprova transferência como Prefeitura
   */
  async approveTransferAsMunicipality(requestHash: string): Promise<{
    success: boolean;
    txHash: string;
  }> {
    try {
      const tx = await this.propertyContract.approveTransferAsMunicipality(requestHash, {
        type: 0,
        gasLimit: 200000,
        gasPrice: 1000
      });

      await tx.wait();
      return { success: true, txHash: tx.hash };

    } catch (error: any) {
      throw new Error(`Falha na aprovação da prefeitura: ${error.message}`);
    }
  }

  /**
   * Executa transferência após todas as aprovações
   */
  async executeTransfer(requestHash: string): Promise<{
    success: boolean;
    txHash: string;
    blockNumber: number;
  }> {
    try {
      console.log(`⚡ Executando transferência...`);

      const tx = await this.propertyContract.executeTransfer(requestHash, {
        type: 0,
        gasLimit: 500000,
        gasPrice: 1000
      });

      const receipt = await tx.wait();
      console.log(`✅ Transferência executada com sucesso!`);

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error: any) {
      throw new Error(`Falha ao executar transferência: ${error.message}`);
    }
  }

  /**
   * Consulta status de uma transferência pendente
   */
  async getTransferStatus(requestHash: string): Promise<{
    exists: boolean;
    matricula: number;
    from: string;
    to: string;
    financialApproved: boolean;
    registryOfficeApproved: boolean;
    municipalityApproved: boolean;
    executed: boolean;
  }> {
    try {
      const transfer = await this.propertyContract.pendingTransfers(requestHash);

      return {
        exists: transfer.exists,
        matricula: Number(transfer.matricula),
        from: transfer.from,
        to: transfer.to,
        financialApproved: transfer.financialApproved,
        registryOfficeApproved: transfer.registryOfficeApproved,
        municipalityApproved: transfer.municipalityApproved,
        executed: transfer.executed
      };

    } catch (error: any) {
      throw new Error(`Falha ao consultar status: ${error.message}`);
    }
  }
}

export const propertyServiceV2 = new PropertyServiceV2();

