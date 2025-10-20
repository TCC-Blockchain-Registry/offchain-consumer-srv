import { Router, Request, Response } from 'express';
import { ApproversService, ApproverType } from '../services/approversService';

const router = Router();
const approversService = new ApproversService();

/**
 * POST /api/approvers/register
 * Registrar um novo aprovador no sistema
 * 
 * Body:
 * {
 *   "wallet": "0x...",
 *   "type": 0 | 1 | 2,  // 0=CARTORIO, 1=PREFEITURA, 2=IF
 *   "name": "Nome da instituição",
 *   "document": "CNPJ"
 * }
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { wallet, type, name, document } = req.body;
    
    if (!wallet || type === undefined || !name || !document) {
      return res.status(400).json({
        error: 'Campos obrigatórios: wallet, type, name, document'
      });
    }
    
    // Validar tipo
    if (![0, 1, 2].includes(Number(type))) {
      return res.status(400).json({
        error: 'Tipo inválido. Use: 0=CARTORIO, 1=PREFEITURA, 2=INSTITUICAO_FINANCEIRA'
      });
    }
    
    const txHash = await approversService.registerApprover(
      wallet,
      Number(type) as ApproverType,
      name,
      document
    );
    
    res.json({
      success: true,
      message: 'Aprovador registrado com sucesso',
      data: {
        wallet,
        type: Number(type),
        typeName: ApproverType[Number(type)],
        name,
        txHash
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao registrar aprovador',
      details: error.message
    });
  }
});

/**
 * GET /api/approvers/validate/:wallet
 * Verificar se um endereço é um aprovador válido
 */
router.get('/validate/:wallet', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    const isValid = await approversService.isValidApprover(wallet);
    
    res.json({
      success: true,
      wallet,
      isValid
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao validar aprovador',
      details: error.message
    });
  }
});

/**
 * GET /api/approvers/:wallet
 * Obter informações completas de um aprovador
 */
router.get('/:wallet', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    const info = await approversService.getApproverInfo(wallet);
    
    res.json({
      success: true,
      data: {
        ...info,
        typeName: ApproverType[info.approverType],
        registeredAtDate: new Date(info.registeredAt * 1000).toISOString()
      }
    });
    
  } catch (error: any) {
    res.status(404).json({
      error: 'Aprovador não encontrado',
      details: error.message
    });
  }
});

/**
 * GET /api/approvers
 * Listar todos os aprovadores ou filtrar por tipo
 * 
 * Query params:
 * - type: 0 | 1 | 2 (opcional)
 * - activeOnly: true | false (opcional, padrão: false)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, activeOnly } = req.query;
    
    let approvers: string[];
    
    // Filtrar por tipo
    if (type !== undefined) {
      const approverType = Number(type) as ApproverType;
      if (![0, 1, 2].includes(approverType)) {
        return res.status(400).json({
          error: 'Tipo inválido. Use: 0=CARTORIO, 1=PREFEITURA, 2=INSTITUICAO_FINANCEIRA'
        });
      }
      approvers = await approversService.getApproversByType(approverType);
    }
    // Apenas ativos
    else if (activeOnly === 'true') {
      approvers = await approversService.getActiveApprovers();
    }
    // Todos
    else {
      approvers = await approversService.getAllApprovers();
    }
    
    // Buscar informações detalhadas de cada aprovador
    const approversInfo = await Promise.all(
      approvers.map(async (wallet) => {
        try {
          const info = await approversService.getApproverInfo(wallet);
          return {
            ...info,
            typeName: ApproverType[info.approverType],
            registeredAtDate: new Date(info.registeredAt * 1000).toISOString()
          };
        } catch {
          return null;
        }
      })
    );
    
    // Filtrar nulos
    const validApprovers = approversInfo.filter(info => info !== null);
    
    res.json({
      success: true,
      count: validApprovers.length,
      data: validApprovers
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao listar aprovadores',
      details: error.message
    });
  }
});

/**
 * GET /api/approvers/recommended/list
 * Obter aprovadores recomendados para uma transferência
 * Retorna 1 de cada tipo se disponível
 */
router.get('/recommended/list', async (req: Request, res: Response) => {
  try {
    const recommended = await approversService.getRecommendedApprovers();
    
    // Buscar informações de cada um
    const details: any = {};
    
    if (recommended.cartorio) {
      details.cartorio = await approversService.getApproverInfo(recommended.cartorio);
      details.cartorio.typeName = 'CARTORIO';
    }
    
    if (recommended.prefeitura) {
      details.prefeitura = await approversService.getApproverInfo(recommended.prefeitura);
      details.prefeitura.typeName = 'PREFEITURA';
    }
    
    if (recommended.instituicaoFinanceira) {
      details.instituicaoFinanceira = await approversService.getApproverInfo(recommended.instituicaoFinanceira);
      details.instituicaoFinanceira.typeName = 'INSTITUICAO_FINANCEIRA';
    }
    
    // Lista de endereços para usar no configureTransfer
    const approversList = [
      recommended.cartorio,
      recommended.prefeitura,
      recommended.instituicaoFinanceira
    ].filter(Boolean);
    
    res.json({
      success: true,
      message: 'Use a lista approverAddresses no endpoint de configurar transferência',
      approverAddresses: approversList,
      details
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao buscar recomendados',
      details: error.message
    });
  }
});

/**
 * POST /api/approvers/validate-list
 * Validar se uma lista de aprovadores são todos válidos
 * 
 * Body:
 * {
 *   "approvers": ["0x...", "0x...", ...]
 * }
 */
router.post('/validate-list', async (req: Request, res: Response) => {
  try {
    const { approvers } = req.body;
    
    if (!approvers || !Array.isArray(approvers)) {
      return res.status(400).json({
        error: 'Campo obrigatório: approvers (array)'
      });
    }
    
    const isValid = await approversService.validateApprovers(approvers);
    
    res.json({
      success: true,
      allValid: isValid,
      count: approvers.length
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao validar lista',
      details: error.message
    });
  }
});

/**
 * POST /api/approvers/:wallet/deactivate
 * Desativar um aprovador
 */
router.post('/:wallet/deactivate', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    const txHash = await approversService.deactivateApprover(wallet);
    
    res.json({
      success: true,
      message: 'Aprovador desativado',
      wallet,
      txHash
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao desativar aprovador',
      details: error.message
    });
  }
});

/**
 * POST /api/approvers/:wallet/reactivate
 * Reativar um aprovador
 */
router.post('/:wallet/reactivate', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    const txHash = await approversService.reactivateApprover(wallet);
    
    res.json({
      success: true,
      message: 'Aprovador reativado',
      wallet,
      txHash
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao reativar aprovador',
      details: error.message
    });
  }
});

export default router;

