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
// ApproversRegistry não existe mais no sistema V2
// const ApproversRegistryABI = require('./src/abis/ApproversRegistry.json');

class EventListenerService {
    constructor() {
        // Ethers v6 syntax (não tem mais .providers)
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        this.webhookUrl = process.env.WEBHOOK_URL;
        this.webhookApiKey = process.env.WEBHOOK_API_KEY;
        
        // Inicializar contratos (ethers v6)
        this.contracts = {
            propertyTitle: new ethers.Contract(
                process.env.PROPERTY_TITLE_ADDRESS,
                PropertyTitleABI.abi || PropertyTitleABI,
                this.provider
            ),
            registryModule: new ethers.Contract(
                process.env.REGISTRY_MODULE_ADDRESS,
                RegistryModuleABI.abi || RegistryModuleABI,
                this.provider
            ),
            approvalsModule: new ethers.Contract(
                process.env.APPROVALS_MODULE_ADDRESS,
                ApprovalsModuleABI.abi || ApprovalsModuleABI,
                this.provider
            )
            // ApproversRegistry removido do sistema V2
            // approversRegistry: new ethers.Contract(
            //     process.env.APPROVERS_REGISTRY_ADDRESS,
            //     ApproversRegistryABI.abi,
            //     this.provider
            // )
        };
    }
    
    /**
     * Envia evento para webhook do orquestrador
     * @param {object} payload - Dados do evento
     * @param {string} endpoint - Endpoint específico (opcional, usa this.webhookUrl se não fornecido)
     */
    async sendToWebhook(payload, endpoint = null) {
        try {
            const url = endpoint || this.webhookUrl;
            console.log(`📡 Enviando evento: ${payload.eventType} para ${url}`);

            const response = await axios.post(url, payload, {
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
            setTimeout(() => this.sendToWebhook(payload, endpoint), 5000);
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
        // this.listenApproversRegistryEvents(); // Removido - ApproversRegistry não existe mais

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

            const baseUrl = this.webhookUrl.replace(/\/api\/webhooks\/blockchain.*$/, '');
            const endpoint = `${baseUrl}/api/webhooks/blockchain/properties/issued`;

            await this.sendToWebhook({
                eventType: 'PROPERTY_ISSUED',
                matricula: matricula.toString(),
                owner: owner,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: new Date().toISOString()
            }, endpoint);
        });
        
        // PropertyTransferred
        propertyTitle.on('PropertyTransferred', async (matricula, from, to, event) => {
            console.log(`  → PropertyTransferred: ${matricula} de ${from} para ${to}`);

            // Enviar para endpoint específico de transferência
            const baseUrl = this.webhookUrl.replace(/\/api\/webhooks\/blockchain.*$/, '');
            const endpoint = `${baseUrl}/api/webhooks/blockchain/properties/transferred`;

            await this.sendToWebhook({
                matriculaId: Number(matricula.toString()),
                from: from,
                to: to,
                transactionHash: event.transactionHash
            }, endpoint);
        });
        
        // PropertyFrozen
        propertyTitle.on('PropertyFrozen', async (matricula, frozen, event) => {
            console.log(`  → PropertyFrozen: ${matricula} (${frozen ? 'congelado' : 'descongelado'})`);

            const baseUrl = this.webhookUrl.replace(/\/api\/webhooks\/blockchain.*$/, '');
            const endpoint = `${baseUrl}/api/webhooks/blockchain/properties/frozen`;

            await this.sendToWebhook({
                eventType: 'PROPERTY_FROZEN',
                matricula: matricula.toString(),
                frozen: frozen,
                transactionHash: event.transactionHash,
                timestamp: new Date().toISOString()
            }, endpoint);
        });

        // ========== V2 Registration Events ==========

        // RegistrationRequested
        propertyTitle.on('RegistrationRequested', async (requestHash, matricula, beneficiary, requester, event) => {
            console.log(`  → RegistrationRequested: Matrícula ${matricula} - Hash ${requestHash}`);

            // Enviar para endpoint específico de registro
            const baseUrl = this.webhookUrl.replace(/\/api\/webhooks\/blockchain.*$/, '');
            const endpoint = `${baseUrl}/api/webhooks/blockchain/properties/registration-requested`;

            await this.sendToWebhook({
                eventType: 'REGISTRATION_REQUESTED',
                requestHash: requestHash,
                matriculaId: Number(matricula.toString()),
                beneficiary: beneficiary,
                requester: requester,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: new Date().toISOString()
            }, endpoint);
        });

        // RegistrationApproved
        propertyTitle.on('RegistrationApproved', async (requestHash, institution, approver, event) => {
            console.log(`  → RegistrationApproved: ${institution} por ${approver}`);

            const baseUrl = this.webhookUrl.replace(/\/api\/webhooks\/blockchain.*$/, '');
            const endpoint = `${baseUrl}/api/webhooks/blockchain/properties/registration-approved`;

            await this.sendToWebhook({
                eventType: 'REGISTRATION_APPROVED',
                requestHash: requestHash,
                institution: institution,
                approver: approver,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: new Date().toISOString()
            }, endpoint);
        });

        // RegistrationExecuted
        propertyTitle.on('RegistrationExecuted', async (requestHash, matricula, beneficiary, event) => {
            console.log(`  → RegistrationExecuted: Matrícula ${matricula} para ${beneficiary}`);

            // Enviar para endpoint específico de registro executado
            const baseUrl = this.webhookUrl.replace(/\/api\/webhooks\/blockchain.*$/, '');
            const endpoint = `${baseUrl}/api/webhooks/blockchain/properties/registration-executed`;

            await this.sendToWebhook({
                eventType: 'REGISTRATION_EXECUTED',
                requestHash: requestHash,
                matriculaId: Number(matricula.toString()),
                beneficiary: beneficiary,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: new Date().toISOString()
            }, endpoint);
        });

        // ========== V2 Transfer Events ==========

        // TransferRequested
        propertyTitle.on('TransferRequested', async (...args) => {
            // O último argumento é sempre o objeto do evento
            const event = args[args.length - 1];

            // Extrair parâmetros do evento
            const requestHash = event.args[0];
            const matricula = event.args[1];
            const from = event.args[2];
            const to = event.args[3];
            const requester = event.args[4];

            console.log(`  → TransferRequested: Matrícula ${matricula} - ${from} → ${to}`);
            console.log(`  → DEBUG - requestHash:`, requestHash);
            console.log(`  → DEBUG - transactionHash:`, event.transactionHash);

            // Enviar para endpoint específico de transferência requisitada
            const baseUrl = this.webhookUrl.replace(/\/api\/webhooks\/blockchain.*$/, '');
            const endpoint = `${baseUrl}/api/webhooks/blockchain/transfers/transfer-requested`;

            await this.sendToWebhook({
                eventType: 'TRANSFER_REQUESTED',
                transferHash: requestHash,
                matriculaId: Number(matricula.toString()),
                from: from,
                to: to,
                requester: requester,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: new Date().toISOString()
            }, endpoint);
        });

        // TransferApproved
        propertyTitle.on('TransferApproved', async (requestHash, institution, approver, event) => {
            console.log(`  → TransferApproved: ${institution} por ${approver}`);

            const baseUrl = this.webhookUrl.replace(/\/api\/webhooks\/blockchain.*$/, '');
            const endpoint = `${baseUrl}/api/webhooks/blockchain/transfers/transfer-approved`;

            await this.sendToWebhook({
                eventType: 'TRANSFER_APPROVED',
                requestHash: requestHash,
                institution: institution,
                approver: approver,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: new Date().toISOString()
            }, endpoint);
        });

        // TransferExecuted
        propertyTitle.on('TransferExecuted', async (requestHash, matricula, from, to, event) => {
            console.log(`  → TransferExecuted: Matrícula ${matricula} - ${from} → ${to}`);

            // Enviar para endpoint específico de transferência executada
            const baseUrl = this.webhookUrl.replace(/\/api\/webhooks\/blockchain.*$/, '');
            const endpoint = `${baseUrl}/api/webhooks/blockchain/transfers/transfer-executed`;

            await this.sendToWebhook({
                eventType: 'TRANSFER_EXECUTED',
                requestHash: requestHash,
                matriculaId: Number(matricula.toString()),
                from: from,
                to: to,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: new Date().toISOString()
            }, endpoint);
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

                const baseUrl = this.webhookUrl.replace(/\/api\/webhooks\/blockchain.*$/, '');
                const endpoint = `${baseUrl}/api/webhooks/blockchain/properties/registered`;

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
                }, endpoint);
            } catch (error) {
                console.error(`Erro ao buscar dados da propriedade: ${error.message}`);
            }
        });
        
        // PropertyUpdated
        registryModule.on('PropertyUpdated', async (matriculaId, event) => {
            console.log(`  → PropertyUpdated: ${matriculaId}`);
            
            try {
                const property = await registryModule.getProperty(matriculaId);

                const baseUrl = this.webhookUrl.replace(/\/api\/webhooks\/blockchain.*$/, '');
                const endpoint = `${baseUrl}/api/webhooks/blockchain/properties/updated`;

                await this.sendToWebhook({
                    eventType: 'PROPERTY_UPDATED',
                    matricula: matriculaId.toString(),
                    isRegular: property.isRegular,
                    transactionHash: event.transactionHash,
                    timestamp: new Date().toISOString()
                }, endpoint);
            } catch (error) {
                console.error(`Erro ao buscar dados da propriedade: ${error.message}`);
            }
        });
    }
    
    /**
     * Eventos de ApprovalsModule
     */
    listenApprovalEvents() {
        const { approvalsModule } = this.contracts;
        // approversRegistry removido do sistema V2
        
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
                // Enviar para endpoint específico de configuração de transferência
                const baseUrl = this.webhookUrl.replace(/\/api\/webhooks\/blockchain.*$/, '');
                const endpoint = `${baseUrl}/api/webhooks/blockchain/properties/transfer-configured`;

                await this.sendToWebhook({
                    matriculaId: Number(matriculaId.toString()),
                    transferHash: transferHash,  // Request hash from blockchain
                    seller: from,
                    buyer: to,
                    transactionHash: event.transactionHash
                }, endpoint);

                // Também enviar para webhook genérico (para compatibilidade)
                // ApproversRegistry removido - usar apenas endereços
                const approverNames = requiredApprovers.map((addr) => ({
                    address: addr,
                    name: 'Approver',
                    type: 'UNKNOWN'
                }));

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
                // ApproversRegistry removido - usar apenas endereço

                const baseUrl = this.webhookUrl.replace(/\/api\/webhooks\/blockchain.*$/, '');
                const endpoint = `${baseUrl}/api/webhooks/blockchain/approvals/approved`;

                await this.sendToWebhook({
                    eventType: 'TRANSFER_APPROVED',
                    transferHash: transferHash,
                    approver: {
                        address: approver,
                        name: 'Approver',
                        type: 'UNKNOWN'
                    },
                    progress: {
                        current: Number(approvalCount),
                        required: Number(required),
                        percentage: Math.round((Number(approvalCount) / Number(required)) * 100)
                    },
                    transactionHash: event.transactionHash,
                    timestamp: new Date().toISOString()
                }, endpoint);
            } catch (error) {
                console.error(`Erro ao buscar aprovador: ${error.message}`);
            }
        });
        
        // BuyerAccepted
        approvalsModule.on('BuyerAccepted', async (transferHash, buyer, event) => {
            console.log(`  → BuyerAccepted: ${buyer}`);

            const baseUrl = this.webhookUrl.replace(/\/api\/webhooks\/blockchain.*$/, '');
            const endpoint = `${baseUrl}/api/webhooks/blockchain/approvals/buyer-accepted`;

            await this.sendToWebhook({
                eventType: 'BUYER_ACCEPTED',
                transferHash: transferHash,
                buyer: buyer,
                transactionHash: event.transactionHash,
                timestamp: new Date().toISOString()
            }, endpoint);
        });

        // TransferConfigCleared
        approvalsModule.on('TransferConfigCleared', async (transferHash, event) => {
            console.log(`  → TransferConfigCleared: ${transferHash}`);

            const baseUrl = this.webhookUrl.replace(/\/api\/webhooks\/blockchain.*$/, '');
            const endpoint = `${baseUrl}/api/webhooks/blockchain/approvals/config-cleared`;

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
        // this.contracts.approversRegistry.removeAllListeners(); // Removido

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

