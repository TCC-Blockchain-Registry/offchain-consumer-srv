import { Router, Request, Response } from 'express';
import { TransferService } from '../services/transferService';

const router = Router();
const transferService = new TransferService();

/**
 * POST /api/transfers/configure
 * PASSO 1: Configurar uma nova transferência com aprovadores
 * 
 * Este é o primeiro passo para transferir um imóvel.
 * O orquestrador configura quais aprovadores devem aprovar a transferência.
 * 
 * IMPORTANTE: 
 * - Os aprovadores devem estar registrados no ApproversRegistry
 * - Use GET /api/approvers/recommended/list para obter aprovadores sugeridos
 * 
 * Body:
 * {
 *   "from": "0x...",  // Endereço do vendedor (dono atual)
 *   "to": "0x...",    // Endereço do comprador
 *   "matriculaId": 123456,
 *   "approvers": [    // Lista de aprovadores registrados
 *     "0xCARTORIO",
 *     "0xPREFEITURA",
 *     "0xIF"
 *   ]
 * }
 */
router.post('/configure', async (req: Request, res: Response) => {
  try {
    const { from, to, matriculaId, approvers } = req.body;
    
    if (!from || !to || !matriculaId || !approvers || !Array.isArray(approvers)) {
      return res.status(400).json({
        error: 'Campos obrigatórios: from, to, matriculaId, approvers (array)'
      });
    }
    
    if (approvers.length === 0) {
      return res.status(400).json({
        error: 'Pelo menos um aprovador é necessário'
      });
    }
    
    const txHash = await transferService.configureTransfer(
      from,
      to,
      Number(matriculaId),
      approvers
    );
    
    res.json({
      success: true,
      message: 'Transferência configurada com sucesso',
      nextSteps: [
        'Cada aprovador deve chamar POST /api/transfers/approve',
        'Comprador deve chamar POST /api/transfers/accept',
        'Vendedor deve chamar POST /api/transfers/execute'
      ],
      data: {
        from,
        to,
        matriculaId: Number(matriculaId),
        requiredApprovers: approvers,
        txHash
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao configurar transferência',
      details: error.message
    });
  }
});

/**
 * POST /api/transfers/approve
 * PASSO 2: Aprovador registra sua aprovação
 * 
 * Cada aprovador da lista configurada deve chamar este endpoint.
 * Apenas aprovadores registrados e ativos podem aprovar.
 * 
 * Body:
 * {
 *   "from": "0x...",
 *   "to": "0x...",
 *   "matriculaId": 123456,
 *   "approverPrivateKey": "0x..."  // Private key do aprovador
 * }
 */
router.post('/approve', async (req: Request, res: Response) => {
  try {
    const { from, to, matriculaId, approverPrivateKey } = req.body;
    
    if (!from || !to || !matriculaId || !approverPrivateKey) {
      return res.status(400).json({
        error: 'Campos obrigatórios: from, to, matriculaId, approverPrivateKey'
      });
    }
    
    const result = await transferService.approve(
      from,
      to,
      Number(matriculaId),
      approverPrivateKey
    );
    
    const allApproved = result.progress.current === result.progress.required;
    
    res.json({
      success: true,
      message: 'Aprovação registrada com sucesso',
      data: {
        approver: result.approver,
        progress: result.progress,
        allApproved,
        nextStep: allApproved 
          ? 'Comprador deve aceitar: POST /api/transfers/accept'
          : `Aguardando mais ${result.progress.required - result.progress.current} aprovação(ões)`,
        txHash: result.txHash
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao aprovar transferência',
      details: error.message
    });
  }
});

/**
 * POST /api/transfers/accept
 * PASSO 3: Comprador aceita a transferência
 * 
 * O comprador (to) deve aceitar a transferência após todas as aprovações.
 * 
 * Body:
 * {
 *   "from": "0x...",
 *   "matriculaId": 123456,
 *   "buyerPrivateKey": "0x..."  // Private key do comprador
 * }
 */
router.post('/accept', async (req: Request, res: Response) => {
  try {
    const { from, matriculaId, buyerPrivateKey } = req.body;
    
    if (!from || !matriculaId || !buyerPrivateKey) {
      return res.status(400).json({
        error: 'Campos obrigatórios: from, matriculaId, buyerPrivateKey'
      });
    }
    
    const result = await transferService.acceptTransfer(
      from,
      Number(matriculaId),
      buyerPrivateKey
    );
    
    res.json({
      success: true,
      message: 'Comprador aceitou a transferência',
      data: {
        buyer: result.buyer,
        nextStep: 'Vendedor pode executar: POST /api/transfers/execute',
        txHash: result.txHash
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao aceitar transferência',
      details: error.message
    });
  }
});

/**
 * POST /api/transfers/execute
 * PASSO 4 (FINAL): Executar a transferência
 * 
 * O vendedor (from) executa a transferência final após:
 * - Todas as aprovações registradas
 * - Comprador aceitou
 * 
 * Body:
 * {
 *   "to": "0x...",
 *   "matriculaId": 123456,
 *   "sellerPrivateKey": "0x..."  // Private key do vendedor
 * }
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { to, matriculaId, sellerPrivateKey } = req.body;
    
    if (!to || !matriculaId || !sellerPrivateKey) {
      return res.status(400).json({
        error: 'Campos obrigatórios: to, matriculaId, sellerPrivateKey'
      });
    }
    
    const result = await transferService.executeTransfer(
      to,
      Number(matriculaId),
      sellerPrivateKey
    );
    
    res.json({
      success: true,
      message: '🎉 Transferência executada com sucesso! Propriedade transferida.',
      data: {
        from: result.from,
        to: result.to,
        matriculaId: result.matriculaId,
        txHash: result.txHash
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao executar transferência',
      details: error.message
    });
  }
});

/**
 * GET /api/transfers/status
 * Consultar status de uma transferência configurada
 * 
 * Query params:
 * - from: endereço do vendedor
 * - to: endereço do comprador
 * - matriculaId: ID da matrícula
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { from, to, matriculaId } = req.query;
    
    if (!from || !to || !matriculaId) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: from, to, matriculaId'
      });
    }
    
    const status = await transferService.getTransferStatus(
      from as string,
      to as string,
      Number(matriculaId)
    );
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao consultar status',
      details: error.message
    });
  }
});

/**
 * GET /api/transfers/details
 * Obter informações detalhadas de uma transferência
 * Inclui quem já aprovou e quem falta
 * 
 * Query params:
 * - from: endereço do vendedor
 * - to: endereço do comprador
 * - matriculaId: ID da matrícula
 */
router.get('/details', async (req: Request, res: Response) => {
  try {
    const { from, to, matriculaId } = req.query;
    
    if (!from || !to || !matriculaId) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: from, to, matriculaId'
      });
    }
    
    const details = await transferService.getTransferDetails(
      from as string,
      to as string,
      Number(matriculaId)
    );
    
    // Calcular próximo passo
    let nextStep = '';
    if (!details.config.isConfigured) {
      nextStep = 'Transferência não configurada';
    } else if (details.config.approvalCount < details.config.requiredApprovers.length) {
      const pending = details.config.requiredApprovers.length - details.config.approvalCount;
      nextStep = `Aguardando ${pending} aprovação(ões)`;
    } else if (!details.config.buyerAccepted) {
      nextStep = 'Aguardando comprador aceitar';
    } else if (details.readyToExecute) {
      nextStep = 'Pronto para executar! Vendedor pode chamar POST /api/transfers/execute';
    }
    
    res.json({
      success: true,
      data: {
        ...details,
        nextStep
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao buscar detalhes',
      details: error.message
    });
  }
});

/**
 * GET /api/transfers/has-approved
 * Verificar se um aprovador específico já aprovou
 * 
 * Query params:
 * - from: endereço do vendedor
 * - to: endereço do comprador
 * - matriculaId: ID da matrícula
 * - approver: endereço do aprovador
 */
router.get('/has-approved', async (req: Request, res: Response) => {
  try {
    const { from, to, matriculaId, approver } = req.query;
    
    if (!from || !to || !matriculaId || !approver) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: from, to, matriculaId, approver'
      });
    }
    
    const hasApproved = await transferService.hasApproved(
      from as string,
      to as string,
      Number(matriculaId),
      approver as string
    );
    
    res.json({
      success: true,
      approver,
      hasApproved
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao verificar aprovação',
      details: error.message
    });
  }
});

export default router;

