import { ethers } from 'ethers';
import {
  getPropertyTitleWithSigner,
  propertyTitleContract
} from '../config/contracts';
import { adminWallet, createWallet } from '../config/blockchain';

export class SystemService {

  /**
   * Pausar o sistema (bloqueia todas as transferências)
   * Requer AGENT_ROLE
   */
  async pause(): Promise<string> {
    try {
      console.log(`⏸️ Pausando sistema...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.pause({
        type: 0,
        gasLimit: 100000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Sistema pausado! Transferências bloqueadas.`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao pausar sistema:', error);
      throw new Error(`Falha ao pausar: ${error.message}`);
    }
  }

  /**
   * Despausar o sistema (permite transferências novamente)
   * Requer AGENT_ROLE
   */
  async unpause(): Promise<string> {
    try {
      console.log(`▶️ Despausando sistema...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.unpause({
        type: 0,
        gasLimit: 100000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Sistema ativo! Transferências permitidas.`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao despausar sistema:', error);
      throw new Error(`Falha ao despausar: ${error.message}`);
    }
  }

  /**
   * Adicionar agente
   * Requer AGENT_ROLE
   */
  async addAgent(agentAddress: string): Promise<string> {
    try {
      console.log(`➕ Adicionando agente: ${agentAddress}...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.addAgent(agentAddress, {
        type: 0,
        gasLimit: 150000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Agente adicionado!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao adicionar agente:', error);
      throw new Error(`Falha ao adicionar agente: ${error.message}`);
    }
  }

  /**
   * Remover agente
   * Requer AGENT_ROLE
   */
  async removeAgent(agentAddress: string): Promise<string> {
    try {
      console.log(`➖ Removendo agente: ${agentAddress}...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.removeAgent(agentAddress, {
        type: 0,
        gasLimit: 150000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Agente removido!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao remover agente:', error);
      throw new Error(`Falha ao remover agente: ${error.message}`);
    }
  }

  /**
   * Verificar se um endereço é agente
   */
  async isAgent(address: string): Promise<boolean> {
    try {
      return await propertyTitleContract.isAgent(address);
    } catch (error: any) {
      throw new Error(`Erro ao verificar agente: ${error.message}`);
    }
  }

  /**
   * Congelar endereço completamente
   * Requer AGENT_ROLE
   */
  async setAddressFrozen(address: string, freeze: boolean): Promise<string> {
    try {
      console.log(`${freeze ? '❄️ Congelando' : '🔥 Descongelando'} endereço ${address}...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.setAddressFrozen(address, freeze, {
        type: 0,
        gasLimit: 150000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Endereço ${freeze ? 'congelado' : 'descongelado'}!`);
      return tx.hash;

    } catch (error: any) {
      console.error(`❌ Erro ao ${freeze ? 'congelar' : 'descongelar'} endereço:`, error);
      throw new Error(`Falha ao ${freeze ? 'congelar' : 'descongelar'} endereço: ${error.message}`);
    }
  }

  /**
   * Congelar múltiplos endereços em lote
   * Requer AGENT_ROLE
   */
  async batchSetAddressFrozen(addresses: string[], freeze: boolean[]): Promise<string> {
    try {
      console.log(`${freeze[0] ? '❄️ Congelando' : '🔥 Descongelando'} ${addresses.length} endereços em lote...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.batchSetAddressFrozen(addresses, freeze, {
        type: 0,
        gasLimit: 300000 + (addresses.length * 50000),
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ ${addresses.length} endereços processados!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro no batch freeze de endereços:', error);
      throw new Error(`Falha no batch freeze: ${error.message}`);
    }
  }

  /**
   * Congelar parcialmente tokens de um endereço
   * Requer AGENT_ROLE
   */
  async freezePartialTokens(address: string, amount: number): Promise<string> {
    try {
      console.log(`❄️ Congelando ${amount} tokens do endereço ${address}...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.freezePartialTokens(address, amount, {
        type: 0,
        gasLimit: 150000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ ${amount} tokens congelados!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao congelar tokens:', error);
      throw new Error(`Falha ao congelar tokens: ${error.message}`);
    }
  }

  /**
   * Descongelar parcialmente tokens de um endereço
   * Requer AGENT_ROLE
   */
  async unfreezePartialTokens(address: string, amount: number): Promise<string> {
    try {
      console.log(`🔥 Descongelando ${amount} tokens do endereço ${address}...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.unfreezePartialTokens(address, amount, {
        type: 0,
        gasLimit: 150000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ ${amount} tokens descongelados!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao descongelar tokens:', error);
      throw new Error(`Falha ao descongelar tokens: ${error.message}`);
    }
  }

  /**
   * Congelar parcialmente tokens em lote
   * Requer AGENT_ROLE
   */
  async batchFreezePartialTokens(addresses: string[], amounts: number[]): Promise<string> {
    try {
      console.log(`❄️ Congelando tokens de ${addresses.length} endereços em lote...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.batchFreezePartialTokens(addresses, amounts, {
        type: 0,
        gasLimit: 300000 + (addresses.length * 50000),
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Tokens congelados para ${addresses.length} endereços!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro no batch freeze de tokens:', error);
      throw new Error(`Falha no batch freeze: ${error.message}`);
    }
  }

  /**
   * Descongelar parcialmente tokens em lote
   * Requer AGENT_ROLE
   */
  async batchUnfreezePartialTokens(addresses: string[], amounts: number[]): Promise<string> {
    try {
      console.log(`🔥 Descongelando tokens de ${addresses.length} endereços em lote...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.batchUnfreezePartialTokens(addresses, amounts, {
        type: 0,
        gasLimit: 300000 + (addresses.length * 50000),
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Tokens descongelados para ${addresses.length} endereços!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro no batch unfreeze de tokens:', error);
      throw new Error(`Falha no batch unfreeze: ${error.message}`);
    }
  }

  /**
   * Obter quantidade de tokens congelados de um endereço
   */
  async getFrozenTokens(address: string): Promise<number> {
    try {
      const frozen = await propertyTitleContract.getFrozenTokens(address);
      return Number(frozen);
    } catch (error: any) {
      throw new Error(`Erro ao buscar tokens congelados: ${error.message}`);
    }
  }

  /**
   * Verificar se um endereço está completamente congelado
   */
  async isFrozen(address: string): Promise<boolean> {
    try {
      return await propertyTitleContract.isFrozen(address);
    } catch (error: any) {
      throw new Error(`Erro ao verificar freeze: ${error.message}`);
    }
  }

  /**
   * Verificar se o sistema está pausado
   */
  async paused(): Promise<boolean> {
    try {
      return await propertyTitleContract.paused();
    } catch (error: any) {
      throw new Error(`Erro ao verificar pausa: ${error.message}`);
    }
  }
}
