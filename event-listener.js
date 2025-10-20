/**
 * Event Listener Service
 * 
 * Escuta eventos dos smart contracts e envia para webhook do orquestrador
 */

const { ethers } = require('ethers');
const axios = require('axios');
require('dotenv').config();

// ABIs
const PropertyTitleABI = require('./src/abis/PropertyTitleTREX.json');
const RegistryModuleABI = require('./src/abis/RegistryMDCompliance.json');
const ApprovalsModuleABI = require('./src/abis/ApprovalsModule.json');
const ApproversRegistryABI = require('./src/abis/ApproversRegistry.json');

class EventListenerService {
    constructor() {
        this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
        this.webhookUrl = process.env.WEBHOOK_URL;
        this.webhookApiKey = process.env.WEBHOOK_API_KEY;
        
        // Inicializar contratos
        this.contracts = {
            propertyTitle: new ethers.Contract(
                process.env.PROPERTY_TITLE_ADDRESS,
                PropertyTitleABI.abi,
                this.provider
            ),
            registryModule: new ethers.Contract(
                process.env.REGISTRY_MODULE_ADDRESS,
                RegistryModuleABI.abi,
                this.provider
            ),
            approvalsModule: new ethers.Contract(
                process.env.APPROVALS_MODULE_ADDRESS,
                ApprovalsModuleABI.abi,
                this.provider
            ),
            approversRegistry: new ethers.Contract(
                process.env.APPROVERS_REGISTRY_ADDRESS,
                ApproversRegistryABI.abi,
                this.provider
            )
        };
    }
    
    /**
     * Envia evento para webhook do orquestrador
     */
    async sendToWebhook(payload) {
        try {
            console.log(`📡 Enviando evento: ${payload.eventType}`);
            
            const response = await axios.post(this.webhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Event-Source': 'blockchain-listener',
                    'X-Api-Key': this.webhookApiKey
                },
                timeout: 5000
            });
            
            console.log(`✅ Webhook enviado com sucesso`);
            return response.data;
        } catch (error) {
            console.error(`❌ Erro ao enviar webhook: ${error.message}`);
            
            // Retry após 5 segundos
            setTimeout(() => this.sendToWebhook(payload), 5000);
        }
    }
    
    /**
     * Inicializa todos os listeners
     */
    start() {
        console.log('🎧 Iniciando event listeners...\n');
        
        this.listenPropertyEvents();
        this.listenRegistryEvents();
        this.listenApprovalEvents();
        this.listenApproversRegistryEvents();
        
        console.log('✅ Event listeners ativos!\n');
    }
    
    /**
     * Eventos de PropertyTitleTREX
     */
    listenPropertyEvents() {
        const { propertyTitle } = this.contracts;
        
        console.log('📝 Listening: PropertyTitleTREX');
        
        // PropertyIssued
        propertyTitle.on('PropertyIssued', async (matricula, owner, event) => {
            console.log(`  → PropertyIssued: ${matricula} para ${owner}`);
            
            await this.sendToWebhook({
                eventType: 'PROPERTY_ISSUED',
                matricula: matricula.toString(),
                owner: owner,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: new Date().toISOString()
            });
        });
        
        // PropertyTransferred
        propertyTitle.on('PropertyTransferred', async (matricula, from, to, event) => {
            console.log(`  → PropertyTransferred: ${matricula} de ${from} para ${to}`);
            
            await this.sendToWebhook({
                eventType: 'PROPERTY_TRANSFERRED',
                matricula: matricula.toString(),
                from: from,
                to: to,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: new Date().toISOString()
            });
        });
        
        // PropertyFrozen
        propertyTitle.on('PropertyFrozen', async (matricula, frozen, event) => {
            console.log(`  → PropertyFrozen: ${matricula} (${frozen ? 'congelado' : 'descongelado'})`);
            
            await this.sendToWebhook({
                eventType: 'PROPERTY_FROZEN',
                matricula: matricula.toString(),
                frozen: frozen,
                transactionHash: event.transactionHash,
                timestamp: new Date().toISOString()
            });
        });
    }
    
    /**
     * Eventos de RegistryMDCompliance
     */
    listenRegistryEvents() {
        const { registryModule } = this.contracts;
        
        console.log('📝 Listening: RegistryMDCompliance');
        
        // PropertyRegistered
        registryModule.on('PropertyRegistered', async (matriculaId, proprietario, event) => {
            console.log(`  → PropertyRegistered: ${matriculaId} por ${proprietario}`);
            
            try {
                const property = await registryModule.getProperty(matriculaId);
                
                await this.sendToWebhook({
                    eventType: 'PROPERTY_REGISTERED',
                    matricula: matriculaId.toString(),
                    proprietario: proprietario,
                    folha: property.folha.toString(),
                    comarca: property.comarca,
                    endereco: property.endereco,
                    metragem: property.metragem.toString(),
                    tipo: ['URBANO', 'RURAL', 'LITORAL'][property.tipo],
                    isRegular: property.isRegular,
                    transactionHash: event.transactionHash,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error(`Erro ao buscar dados da propriedade: ${error.message}`);
            }
        });
        
        // PropertyUpdated
        registryModule.on('PropertyUpdated', async (matriculaId, event) => {
            console.log(`  → PropertyUpdated: ${matriculaId}`);
            
            try {
                const property = await registryModule.getProperty(matriculaId);
                
                await this.sendToWebhook({
                    eventType: 'PROPERTY_UPDATED',
                    matricula: matriculaId.toString(),
                    isRegular: property.isRegular,
                    transactionHash: event.transactionHash,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error(`Erro ao buscar dados da propriedade: ${error.message}`);
            }
        });
    }
    
    /**
     * Eventos de ApprovalsModule
     */
    listenApprovalEvents() {
        const { approvalsModule, approversRegistry } = this.contracts;
        
        console.log('📝 Listening: ApprovalsModule');
        
        // TransferConfigured
        approvalsModule.on('TransferConfigured', async (
            transferHash,
            from,
            to,
            matriculaId,
            requiredApprovers,
            event
        ) => {
            console.log(`  → TransferConfigured: ${from} → ${to}, imóvel ${matriculaId}`);
            
            try {
                const approverNames = await Promise.all(
                    requiredApprovers.map(async (addr) => {
                        try {
                            const info = await approversRegistry.getApproverInfo(addr);
                            return {
                                address: addr,
                                name: info.name,
                                type: ['CARTORIO', 'PREFEITURA', 'INSTITUICAO_FINANCEIRA'][info.approverType]
                            };
                        } catch {
                            return { address: addr, name: 'Unknown', type: 'UNKNOWN' };
                        }
                    })
                );
                
                await this.sendToWebhook({
                    eventType: 'TRANSFER_CONFIGURED',
                    transferHash: transferHash,
                    from: from,
                    to: to,
                    matricula: matriculaId.toString(),
                    requiredApprovers: approverNames,
                    transactionHash: event.transactionHash,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error(`Erro ao buscar aprovadores: ${error.message}`);
            }
        });
        
        // Approved
        approvalsModule.on('Approved', async (
            transferHash,
            approver,
            approvalCount,
            required,
            event
        ) => {
            console.log(`  → Approved: ${approvalCount}/${required} por ${approver}`);
            
            try {
                const approverInfo = await approversRegistry.getApproverInfo(approver);
                
                await this.sendToWebhook({
                    eventType: 'TRANSFER_APPROVED',
                    transferHash: transferHash,
                    approver: {
                        address: approver,
                        name: approverInfo.name,
                        type: ['CARTORIO', 'PREFEITURA', 'INSTITUICAO_FINANCEIRA'][approverInfo.approverType]
                    },
                    progress: {
                        current: approvalCount.toNumber(),
                        required: required.toNumber(),
                        percentage: Math.round((approvalCount.toNumber() / required.toNumber()) * 100)
                    },
                    transactionHash: event.transactionHash,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error(`Erro ao buscar aprovador: ${error.message}`);
            }
        });
        
        // BuyerAccepted
        approvalsModule.on('BuyerAccepted', async (transferHash, buyer, event) => {
            console.log(`  → BuyerAccepted: ${buyer}`);
            
            await this.sendToWebhook({
                eventType: 'BUYER_ACCEPTED',
                transferHash: transferHash,
                buyer: buyer,
                transactionHash: event.transactionHash,
                timestamp: new Date().toISOString()
            });
        });
        
        // TransferConfigCleared
        approvalsModule.on('TransferConfigCleared', async (transferHash, event) => {
            console.log(`  → TransferConfigCleared: ${transferHash}`);
            
            await this.sendToWebhook({
                eventType: 'TRANSFER_CONFIG_CLEARED',
                transferHash: transferHash,
                transactionHash: event.transactionHash,
                timestamp: new Date().toISOString()
            });
        });
    }
    
    /**
     * Eventos de ApproversRegistry
     */
    listenApproversRegistryEvents() {
        const { approversRegistry } = this.contracts;
        
        console.log('📝 Listening: ApproversRegistry');
        
        // ApproverRegistered
        approversRegistry.on('ApproverRegistered', async (
            wallet,
            approverType,
            name,
            document,
            uniqueHash,
            event
        ) => {
            const types = ['CARTORIO', 'PREFEITURA', 'INSTITUICAO_FINANCEIRA'];
            console.log(`  → ApproverRegistered: ${name} (${types[approverType]})`);
            
            await this.sendToWebhook({
                eventType: 'APPROVER_REGISTERED',
                wallet: wallet,
                type: types[approverType],
                name: name,
                document: document,
                uniqueHash: uniqueHash,
                transactionHash: event.transactionHash,
                timestamp: new Date().toISOString()
            });
        });
        
        // ApproverDeactivated
        approversRegistry.on('ApproverDeactivated', async (wallet, event) => {
            console.log(`  → ApproverDeactivated: ${wallet}`);
            
            try {
                const info = await approversRegistry.getApproverInfo(wallet);
                
                await this.sendToWebhook({
                    eventType: 'APPROVER_DEACTIVATED',
                    wallet: wallet,
                    name: info.name,
                    transactionHash: event.transactionHash,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error(`Erro ao buscar aprovador: ${error.message}`);
            }
        });
        
        // ApproverReactivated
        approversRegistry.on('ApproverReactivated', async (wallet, event) => {
            console.log(`  → ApproverReactivated: ${wallet}`);
            
            try {
                const info = await approversRegistry.getApproverInfo(wallet);
                
                await this.sendToWebhook({
                    eventType: 'APPROVER_REACTIVATED',
                    wallet: wallet,
                    name: info.name,
                    transactionHash: event.transactionHash,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error(`Erro ao buscar aprovador: ${error.message}`);
            }
        });
    }
    
    /**
     * Para todos os listeners
     */
    stop() {
        console.log('\n🛑 Parando event listeners...');
        
        this.contracts.propertyTitle.removeAllListeners();
        this.contracts.registryModule.removeAllListeners();
        this.contracts.approvalsModule.removeAllListeners();
        this.contracts.approversRegistry.removeAllListeners();
        
        console.log('✅ Event listeners parados');
    }
}

// Inicializar serviço
async function main() {
    console.log('🚀 Iniciando Event Listener Service\n');
    
    const eventListener = new EventListenerService();
    eventListener.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        eventListener.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        eventListener.stop();
        process.exit(0);
    });
}

// Executar
main().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});

