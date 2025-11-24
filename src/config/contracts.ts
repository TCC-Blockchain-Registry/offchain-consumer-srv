import { ethers, Contract } from 'ethers';
import { provider, adminWallet, orchestratorWallet, registrarWallet } from './blockchain';

// Importar ABIs
const PropertyTitleABI = require('../abis/PropertyTitleTREX.json');
const RegistryModuleABI = require('../abis/RegistryMDCompliance.json');

// Endereços dos contratos (obtidos do deploy)
export const ADDRESSES = {
  propertyTitle: process.env.PROPERTY_TITLE_ADDRESS!,
  registryModule: process.env.REGISTRY_MODULE_ADDRESS!,
  identityRegistry: process.env.IDENTITY_REGISTRY_ADDRESS!,
  compliance: process.env.MODULAR_COMPLIANCE_ADDRESS!,
};

// Instâncias dos contratos (read-only)
export const propertyTitleContract = new Contract(
  ADDRESSES.propertyTitle,
  PropertyTitleABI.abi || PropertyTitleABI,
  provider
);

export const registryModuleContract = new Contract(
  ADDRESSES.registryModule,
  RegistryModuleABI.abi || RegistryModuleABI,
  provider
);

// Instâncias com signers (para escrever na blockchain)
export function getPropertyTitleWithSigner(signer: ethers.Wallet) {
  return new Contract(ADDRESSES.propertyTitle, PropertyTitleABI.abi || PropertyTitleABI, signer);
}

export function getRegistryModuleWithSigner(signer: ethers.Wallet) {
  return new Contract(ADDRESSES.registryModule, RegistryModuleABI.abi || RegistryModuleABI, signer);
}

