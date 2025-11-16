import { ethers } from 'ethers';
import {
  getPropertyTitleWithSigner,
  propertyTitleContract
} from '../config/contracts';
import { adminWallet } from '../config/blockchain';

export class InfoService {

  // ========== Read-Only Getters ==========

  /**
   * Obter nome do token
   */
  async name(): Promise<string> {
    try {
      return await propertyTitleContract.name();
    } catch (error: any) {
      throw new Error(`Erro ao buscar nome: ${error.message}`);
    }
  }

  /**
   * Obter símbolo do token
   */
  async symbol(): Promise<string> {
    try {
      return await propertyTitleContract.symbol();
    } catch (error: any) {
      throw new Error(`Erro ao buscar símbolo: ${error.message}`);
    }
  }

  /**
   * Obter decimais do token
   */
  async decimals(): Promise<number> {
    try {
      const decimals = await propertyTitleContract.decimals();
      return Number(decimals);
    } catch (error: any) {
      throw new Error(`Erro ao buscar decimais: ${error.message}`);
    }
  }

  /**
   * Obter total supply
   */
  async totalSupply(): Promise<number> {
    try {
      const supply = await propertyTitleContract.totalSupply();
      return Number(supply);
    } catch (error: any) {
      throw new Error(`Erro ao buscar total supply: ${error.message}`);
    }
  }

  /**
   * Obter versão do contrato
   */
  async version(): Promise<string> {
    try {
      return await propertyTitleContract.version();
    } catch (error: any) {
      throw new Error(`Erro ao buscar versão: ${error.message}`);
    }
  }

  /**
   * Obter endereço do Identity Registry
   */
  async identityRegistry(): Promise<string> {
    try {
      return await propertyTitleContract.identityRegistry();
    } catch (error: any) {
      throw new Error(`Erro ao buscar identity registry: ${error.message}`);
    }
  }

  /**
   * Obter endereço do Compliance
   */
  async compliance(): Promise<string> {
    try {
      return await propertyTitleContract.compliance();
    } catch (error: any) {
      throw new Error(`Erro ao buscar compliance: ${error.message}`);
    }
  }

  /**
   * Obter endereço do OnchainID
   */
  async onchainID(): Promise<string> {
    try {
      return await propertyTitleContract.onchainID();
    } catch (error: any) {
      throw new Error(`Erro ao buscar onchain ID: ${error.message}`);
    }
  }

  // ========== Write Operations (Configuration) ==========

  /**
   * Configurar Identity Registry
   * Requer AGENT_ROLE
   */
  async setIdentityRegistry(registryAddress: string): Promise<string> {
    try {
      console.log(`⚙️ Configurando Identity Registry: ${registryAddress}...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.setIdentityRegistry(registryAddress, {
        type: 0,
        gasLimit: 150000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Identity Registry configurado!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao configurar identity registry:', error);
      throw new Error(`Falha ao configurar identity registry: ${error.message}`);
    }
  }

  /**
   * Configurar Compliance
   * Requer AGENT_ROLE
   */
  async setCompliance(complianceAddress: string): Promise<string> {
    try {
      console.log(`⚙️ Configurando Compliance: ${complianceAddress}...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.setCompliance(complianceAddress, {
        type: 0,
        gasLimit: 150000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Compliance configurado!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao configurar compliance:', error);
      throw new Error(`Falha ao configurar compliance: ${error.message}`);
    }
  }

  /**
   * Configurar nome do token
   * Requer AGENT_ROLE
   */
  async setName(name: string): Promise<string> {
    try {
      console.log(`⚙️ Configurando nome: ${name}...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.setName(name, {
        type: 0,
        gasLimit: 150000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Nome configurado!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao configurar nome:', error);
      throw new Error(`Falha ao configurar nome: ${error.message}`);
    }
  }

  /**
   * Configurar símbolo do token
   * Requer AGENT_ROLE
   */
  async setSymbol(symbol: string): Promise<string> {
    try {
      console.log(`⚙️ Configurando símbolo: ${symbol}...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.setSymbol(symbol, {
        type: 0,
        gasLimit: 150000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Símbolo configurado!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao configurar símbolo:', error);
      throw new Error(`Falha ao configurar símbolo: ${error.message}`);
    }
  }

  /**
   * Configurar OnchainID
   * Requer AGENT_ROLE
   */
  async setOnchainID(onchainIDAddress: string): Promise<string> {
    try {
      console.log(`⚙️ Configurando OnchainID: ${onchainIDAddress}...`);

      const propertyTitle = getPropertyTitleWithSigner(adminWallet);

      const tx = await propertyTitle.setOnchainID(onchainIDAddress, {
        type: 0,
        gasLimit: 150000,
        gasPrice: 1000
      });

      console.log(`⏳ Aguardando confirmação... TX: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ OnchainID configurado!`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Erro ao configurar onchain ID:', error);
      throw new Error(`Falha ao configurar onchain ID: ${error.message}`);
    }
  }
}
