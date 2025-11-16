import { Router, Request, Response } from 'express';
import { ApproversService, ApproverType } from '../services/approversService';

const router = Router();
const approversService = new ApproversService();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { wallet, type, name, document } = req.body;

    if (!wallet || type === undefined || !name || !document) {
      return res.status(400).json({
        error: 'Campos obrigatórios: wallet, type, name, document'
      });
    }

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

router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, activeOnly } = req.query;

    let approvers: string[];

    if (type !== undefined) {
      const approverType = Number(type) as ApproverType;
      if (![0, 1, 2].includes(approverType)) {
        return res.status(400).json({
          error: 'Tipo inválido. Use: 0=CARTORIO, 1=PREFEITURA, 2=INSTITUICAO_FINANCEIRA'
        });
      }
      approvers = await approversService.getApproversByType(approverType);
    }
    else if (activeOnly === 'true') {
      approvers = await approversService.getActiveApprovers();
    }
    else {
      approvers = await approversService.getAllApprovers();
    }

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

router.get('/recommended/list', async (req: Request, res: Response) => {
  try {
    const recommended = await approversService.getRecommendedApprovers();

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

