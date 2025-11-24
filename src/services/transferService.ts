import { ethers } from 'ethers';
const PropertyTitleABI = require('../abis/PropertyTitleTREX.json');
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

/**
 * TransferService - Gerencia transferências de propriedades
 */
export class TransferService {
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

      // Garantir que o comprador tem identidade registrada
      await identityService.ensureIdentityRegistered(to);

      // VALIDAÇÕES PRÉ-TRANSAÇÃO
      console.log(`🔍 Validando pré-condições...`);

      // VALIDAÇÃO 1: Verificar se propriedade existe
      const exists = await this.propertyContract.propertyExists(matriculaId);
      console.log(`   ✓ Property exists: ${exists}`);
      if (!exists) {
        throw new Error(`Property ${matriculaId} does not exist. Register it first via /api/properties/approvals/request`);
      }

      // VALIDAÇÃO 2: Verificar dono atual
      const actualOwner = await this.propertyContract.propertyOwner(matriculaId);
      console.log(`   ✓ Current owner: ${actualOwner}`);
      console.log(`   ✓ Expected owner (from): ${from}`);
      if (actualOwner.toLowerCase() !== from.toLowerCase()) {
        throw new Error(`Incorrect owner. Property ${matriculaId} is owned by ${actualOwner}, not ${from}`);
      }

      console.log(`✅ Todas validações passaram! Enviando transação...`);

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
      console.error(`❌ Erro ao solicitar transferência:`, {
        message: error.message,
        reason: error.reason,
        code: error.code,
        data: error.data
      });
      throw new Error(`Falha ao solicitar transferência: ${error.reason || error.message}`);
    }
  }

  /**
   * Aprova transferência como Instituição Financeira
   */
  async approveAsFinancial(requestHash: string): Promise<{
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
  async approveAsRegistryOffice(requestHash: string): Promise<{
    success: boolean;
    txHash: string;
  }> {
    try {
      console.log(`📋 Aprovando transferência como Cartório...`);

      const tx = await this.propertyContract.approveTransferAsRegistryOffice(requestHash, {
        type: 0,
        gasLimit: 200000,
        gasPrice: 1000
      });

      await tx.wait();
      console.log(`✅ Transferência aprovada pelo Cartório!`);

      return { success: true, txHash: tx.hash };

    } catch (error: any) {
      throw new Error(`Falha na aprovação do cartório: ${error.message}`);
    }
  }

  /**
   * Aprova transferência como Prefeitura (auto-executa quando última aprovação)
   */
  async approveAsMunicipality(requestHash: string): Promise<{
    success: boolean;
    txHash: string;
  }> {
    try {
      console.log(`🏛️ Aprovando transferência como Prefeitura...`);

      const tx = await this.propertyContract.approveTransferAsMunicipality(requestHash, {
        type: 0,
        gasLimit: 200000,
        gasPrice: 1000
      });

      await tx.wait();
      console.log(`✅ Transferência aprovada pela Prefeitura (auto-executada)!`);

      return { success: true, txHash: tx.hash };

    } catch (error: any) {
      throw new Error(`Falha na aprovação da prefeitura: ${error.message}`);
    }
  }

  /**
   * Consulta status de uma transferência pendente
   * NOTA: A execução é AUTOMÁTICA quando todas as 3 aprovações são recebidas
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

export const transferService = new TransferService();
