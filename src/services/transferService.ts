import { ethers } from 'ethers';
import {
  getPropertyTitleWithSigner,
  getApprovalsModuleWithSigner,
  approvalsModuleContract,
  ADDRESSES
} from '../config/contracts';
import { adminWallet, createWallet } from '../config/blockchain';

export interface TransferConfig {
  matriculaId: number;
  requiredApprovers: string[];
  approvalCount: number;
  isConfigured: boolean;
  buyerAccepted: boolean;
}

export class TransferService {
  
  /**
   * PASSO 1: Configurar transferência com lista de aprovadores
   * Executado com ORCHESTRATOR_ROLE
   * 
   * IMPORTANTE: Os aprovadores devem estar registrados no ApproversRegistry
   */
  async configureTransfer(
    from: string,
    to: string,
    matriculaId: number,
    requiredApprovers: string[]
  ): Promise<string> {
    try {
      console.log(`⚙️ Configurando transferência da matrícula ${matriculaId}...`);
      console.log(`   De: ${from}`);
      console.log(`   Para: ${to}`);
      console.log(`   Aprovadores necessários: ${requiredApprovers.length}`);
      
      // Usar adminWallet pois tem saldo (orchestratorWallet não foi financiado)
      const approvalsModule = getApprovalsModuleWithSigner(adminWallet);
      
      // Chamar configureTransfer no ApprovalsModule
      const tx = await approvalsModule.configureTransfer(
        from,
        to,
        matriculaId,
        ADDRESSES.compliance,
        requiredApprovers,
        {
          type: 0,
          gasLimit: 400000,
          gasPrice: 1000
        }
      );
      
      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      const receipt = await tx.wait();
      
      console.log(`✅ Transferência configurada! Block: ${receipt.blockNumber}`);
      
      return tx.hash;
      
    } catch (error: any) {
      console.error('❌ Erro ao configurar transferência:', error);
      throw new Error(`Falha ao configurar: ${error.message}`);
    }
  }
  
  /**
   * PASSO 2: Aprovador registra sua aprovação
   * Cada aprovador da lista deve chamar esta função
   * 
   * IMPORTANTE: Apenas aprovadores registrados e ativos podem aprovar
   */
  async approve(
    from: string,
    to: string,
    matriculaId: number,
    approverPrivateKey: string
  ): Promise<{
    txHash: string;
    approver: string;
    progress: { current: number; required: number };
  }> {
    try {
      const approverWallet = createWallet(approverPrivateKey);
      console.log(`👍 Aprovando transferência (aprovador: ${approverWallet.address})...`);
      
      const approvalsModule = getApprovalsModuleWithSigner(approverWallet);
      
      const tx = await approvalsModule.approve(
        from,
        to,
        matriculaId,
        ADDRESSES.compliance,
        {
          type: 0,
          gasLimit: 300000,
          gasPrice: 1000
        }
      );
      
      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      const receipt = await tx.wait();
      
      // Buscar evento Approved para ver o progresso
      let progress = { current: 0, required: 0 };
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = approvalsModule.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          if (parsed?.name === 'Approved') {
            progress.current = Number(parsed.args[2]);
            progress.required = Number(parsed.args[3]);
            return true;
          }
          return false;
        } catch {
          return false;
        }
      });
      
      console.log(`✅ Aprovação registrada! Progresso: ${progress.current}/${progress.required}`);
      
      return {
        txHash: tx.hash,
        approver: approverWallet.address,
        progress
      };
      
    } catch (error: any) {
      console.error('❌ Erro ao aprovar:', error);
      throw new Error(`Falha ao aprovar: ${error.message}`);
    }
  }
  
  /**
   * PASSO 3: Comprador aceita a transferência
   * O comprador (to) deve chamar esta função
   */
  async acceptTransfer(
    from: string,
    matriculaId: number,
    buyerPrivateKey: string
  ): Promise<{
    txHash: string;
    buyer: string;
  }> {
    try {
      const buyerWallet = createWallet(buyerPrivateKey);
      console.log(`🤝 Comprador ${buyerWallet.address} aceitando transferência...`);
      
      const approvalsModule = getApprovalsModuleWithSigner(buyerWallet);
      
      const tx = await approvalsModule.acceptTransfer(
        from,
        matriculaId,
        ADDRESSES.compliance,
        {
          type: 0,
          gasLimit: 250000,
          gasPrice: 1000
        }
      );
      
      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();
      
      console.log(`✅ Comprador aceitou a transferência!`);
      
      return {
        txHash: tx.hash,
        buyer: buyerWallet.address
      };
      
    } catch (error: any) {
      console.error('❌ Erro ao aceitar:', error);
      throw new Error(`Falha ao aceitar: ${error.message}`);
    }
  }
  
  /**
   * PASSO 4: Executar a transferência
   * O vendedor (from) chama esta função após todas as aprovações e aceitação
   * 
   * IMPORTANTE: Só funciona se:
   * - Todas as aprovações foram registradas
   * - Comprador aceitou
   * - Propriedade está regular no compliance
   */
  async executeTransfer(
    to: string,
    matriculaId: number,
    sellerPrivateKey: string
  ): Promise<{
    txHash: string;
    from: string;
    to: string;
    matriculaId: number;
  }> {
    try {
      const sellerWallet = createWallet(sellerPrivateKey);
      console.log(`🚀 Executando transferência da matrícula ${matriculaId}...`);
      console.log(`   De: ${sellerWallet.address}`);
      console.log(`   Para: ${to}`);
      
      const propertyTitle = getPropertyTitleWithSigner(sellerWallet);
      
      const tx = await propertyTitle.transferProperty(
        to,
        matriculaId,
        {
          type: 0,
          gasLimit: 600000,
          gasPrice: 1000
        }
      );
      
      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      const receipt = await tx.wait();
      
      console.log(`✅ Transferência executada! Block: ${receipt.blockNumber}`);
      
      // Buscar evento PropertyTransferred
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = propertyTitle.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          return parsed?.name === 'PropertyTransferred';
        } catch {
          return false;
        }
      });
      
      if (event) {
        console.log(`📋 Matrícula ${matriculaId} transferida com sucesso!`);
      }
      
      return {
        txHash: tx.hash,
        from: sellerWallet.address,
        to,
        matriculaId
      };
      
    } catch (error: any) {
      console.error('❌ Erro ao executar transferência:', error);
      throw new Error(`Falha na transferência: ${error.message}`);
    }
  }
  
  /**
   * Consultar status de uma transferência configurada
   */
  async getTransferStatus(
    from: string,
    to: string,
    matriculaId: number
  ): Promise<TransferConfig> {
    try {
      const config = await approvalsModuleContract.getTransferConfig(
        from,
        to,
        matriculaId,
        ADDRESSES.compliance
      );
      
      return {
        matriculaId: Number(config[0]),
        requiredApprovers: config[1],
        approvalCount: Number(config[2]),
        isConfigured: config[3],
        buyerAccepted: config[4]
      };
      
    } catch (error: any) {
      throw new Error(`Erro ao consultar status: ${error.message}`);
    }
  }
  
  /**
   * Verificar se um aprovador específico já aprovou
   */
  async hasApproved(
    from: string,
    to: string,
    matriculaId: number,
    approverAddress: string
  ): Promise<boolean> {
    try {
      return await approvalsModuleContract.hasApproved(
        from,
        to,
        matriculaId,
        ADDRESSES.compliance,
        approverAddress
      );
      
    } catch (error: any) {
      throw new Error(`Erro ao verificar aprovação: ${error.message}`);
    }
  }
  
  /**
   * Obter informações detalhadas de uma transferência
   * Inclui quem já aprovou e quem falta
   */
  async getTransferDetails(
    from: string,
    to: string,
    matriculaId: number
  ): Promise<{
    config: TransferConfig;
    approvalStatus: {
      approver: string;
      hasApproved: boolean;
    }[];
    readyToExecute: boolean;
  }> {
    try {
      const config = await this.getTransferStatus(from, to, matriculaId);
      
      // Verificar status de cada aprovador
      const approvalStatus = await Promise.all(
        config.requiredApprovers.map(async (approver) => ({
          approver,
          hasApproved: await this.hasApproved(from, to, matriculaId, approver)
        }))
      );
      
      // Verificar se está pronta para executar
      const readyToExecute = 
        config.isConfigured &&
        config.approvalCount === config.requiredApprovers.length &&
        config.buyerAccepted;
      
      return {
        config,
        approvalStatus,
        readyToExecute
      };
      
    } catch (error: any) {
      throw new Error(`Erro ao buscar detalhes: ${error.message}`);
    }
  }
}

