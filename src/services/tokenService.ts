import { ethers } from 'ethers';
import {
  getPropertyTitleWithSigner,
  propertyTitleContract
} from '../config/contracts';
import { adminWallet, createWallet } from '../config/blockchain';

export class TokenService {

  /**
   * Mint tokens diretamente (uso interno - normalmente usa issueProperty)
   * Requer AGENT_ROLE
   */
  async mint(to: string, amount: number): Promise<string> {
    try {
      console.log(`🪙 Mintando ${amount} tokens para ${to}...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.mint(to, amount, {
        type: 0,
        gasLimit: 200000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ ${amount} tokens mintados!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao mintar tokens:', error);
      throw new Error(`Falha ao mintar: ${error.message}`);
    }
  }

  /**
   * Burn tokens
   * Requer AGENT_ROLE
   */
  async burn(address: string, amount: number): Promise<string> {
    try {
      console.log(`🔥 Queimando ${amount} tokens de ${address}...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.burn(address, amount, {
        type: 0,
        gasLimit: 200000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ ${amount} tokens queimados!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao queimar tokens:', error);
      throw new Error(`Falha ao queimar: ${error.message}`);
    }
  }

  /**
   * Mint tokens em lote
   * Requer AGENT_ROLE
   */
  async batchMint(addresses: string[], amounts: number[]): Promise<string> {
    try {
      console.log(`🪙 Mintando tokens para ${addresses.length} endereços em lote...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.batchMint(addresses, amounts, {
        type: 0,
        gasLimit: 300000 + (addresses.length * 50000),
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Tokens mintados para ${addresses.length} endereços!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro no batch mint:', error);
      throw new Error(`Falha no batch mint: ${error.message}`);
    }
  }

  /**
   * Burn tokens em lote
   * Requer AGENT_ROLE
   */
  async batchBurn(addresses: string[], amounts: number[]): Promise<string> {
    try {
      console.log(`🔥 Queimando tokens de ${addresses.length} endereços em lote...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.batchBurn(addresses, amounts, {
        type: 0,
        gasLimit: 300000 + (addresses.length * 50000),
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Tokens queimados de ${addresses.length} endereços!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro no batch burn:', error);
      throw new Error(`Falha no batch burn: ${error.message}`);
    }
  }

  /**
   * Transferência forçada de tokens (quantidade específica)
   * Requer AGENT_ROLE
   */
  async forcedTransfer(from: string, to: string, amount: number): Promise<string> {
    try {
      console.log(`⚠️ Transferência forçada de ${amount} tokens...`);
      console.log(`   De: ${from} → Para: ${to}`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.forcedTransfer(from, to, amount, {
        type: 0,
        gasLimit: 250000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Transferência forçada executada!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro na transferência forçada:', error);
      throw new Error(`Falha na transferência forçada: ${error.message}`);
    }
  }

  /**
   * Transferências forçadas em lote
   * Requer AGENT_ROLE
   */
  async batchForcedTransfer(from: string[], to: string[], amounts: number[]): Promise<string> {
    try {
      console.log(`⚠️ Transferências forçadas em lote: ${from.length} operações...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.batchForcedTransfer(from, to, amounts, {
        type: 0,
        gasLimit: 300000 + (from.length * 80000),
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ ${from.length} transferências forçadas executadas!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro no batch forced transfer:', error);
      throw new Error(`Falha no batch forced transfer: ${error.message}`);
    }
  }

  /**
   * Transferências em lote (do msg.sender)
   * Requer tokens disponíveis
   */
  async batchTransfer(to: string[], amounts: number[], privateKey?: string): Promise<string> {
    try {
      console.log(`📤 Transferências em lote para ${to.length} destinatários...`);

      const wallet = privateKey ? createWallet(privateKey) : adminWallet;
      const propertyTitle = getPropertyTitleWithSigner(wallet);

      const tx = await propertyTitle.batchTransfer(to, amounts, {
        type: 0,
        gasLimit: 300000 + (to.length * 80000),
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ ${to.length} transferências executadas!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro no batch transfer:', error);
      throw new Error(`Falha no batch transfer: ${error.message}`);
    }
  }

  /**
   * Recuperar endereço perdido (migrar tokens)
   * Requer AGENT_ROLE
   */
  async recoveryAddress(lostWallet: string, newWallet: string, onchainID: string): Promise<string> {
    try {
      console.log(`🔄 Recuperando endereço...`);
      console.log(`   Perdido: ${lostWallet}`);
      console.log(`   Novo: ${newWallet}`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.recoveryAddress(lostWallet, newWallet, onchainID, {
        type: 0,
        gasLimit: 300000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      const receipt = await tx.wait();

      console.log(`✅ Endereço recuperado!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro na recuperação:', error);
      throw new Error(`Falha na recuperação: ${error.message}`);
    }
  }
}
