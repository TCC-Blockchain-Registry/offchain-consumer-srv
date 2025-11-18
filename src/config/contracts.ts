import { ethers, Contract } from 'ethers';
import { provider, adminWallet, orchestratorWallet, registrarWallet } from './blockchain';

// Importar ABIs (você precisa ter esses arquivos em src/abis/)
const PropertyTitleABI = require('../abis/PropertyTitleTREX.json');
const ApprovalsModuleABI = require('../abis/ApprovalsModule.json');
const RegistryModuleABI = require('../abis/RegistryMDCompliance.json');
const ApproversRegistryABI = require('../abis/ApproversRegistry.json');

// Endereços dos contratos (obtidos do deploy)
export const ADDRESSES = {
  propertyTitle: process.env.PROPERTY_TITLE_ADDRESS!,
  approvalsModule: process.env.APPROVALS_MODULE_ADDRESS!,
  registryModule: process.env.REGISTRY_MODULE_ADDRESS!,
  approversRegistry: process.env.APPROVERS_REGISTRY_ADDRESS!,
  identityRegistry: process.env.IDENTITY_REGISTRY_ADDRESS!,
  compliance: process.env.MODULAR_COMPLIANCE_ADDRESS!,
};

// Instâncias dos contratos (read-only)
export const propertyTitleContract = new Contract(
  ADDRESSES.propertyTitle,
  PropertyTitleABI.abi || PropertyTitleABI,
  provider
);

export const approvalsModuleContract = new Contract(
  ADDRESSES.approvalsModule,
  ApprovalsModuleABI.abi || ApprovalsModuleABI,
  provider
);

export const registryModuleContract = new Contract(
  ADDRESSES.registryModule,
  RegistryModuleABI.abi || RegistryModuleABI,
  provider
);

export const approversRegistryContract = new Contract(
  ADDRESSES.approversRegistry,
  ApproversRegistryABI.abi || ApproversRegistryABI,
  provider
);

// Instâncias com signers (para escrever na blockchain)
export function getPropertyTitleWithSigner(signer: ethers.Wallet) {
  return new Contract(ADDRESSES.propertyTitle, PropertyTitleABI.abi || PropertyTitleABI, signer);
}

export function getApprovalsModuleWithSigner(signer: ethers.Wallet) {
  return new Contract(ADDRESSES.approvalsModule, ApprovalsModuleABI.abi || ApprovalsModuleABI, signer);
}

export function getRegistryModuleWithSigner(signer: ethers.Wallet) {
  return new Contract(ADDRESSES.registryModule, RegistryModuleABI.abi || RegistryModuleABI, signer);
}

export function getApproversRegistryWithSigner(signer: ethers.Wallet) {
  return new Contract(ADDRESSES.approversRegistry, ApproversRegistryABI.abi || ApproversRegistryABI, signer);
}

