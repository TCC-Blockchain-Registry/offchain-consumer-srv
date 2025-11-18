import { Router, Request, Response } from 'express';
import { PropertyServiceV2 } from '../services/propertyServiceV2';

const router = Router();
const propertyServiceV2 = new PropertyServiceV2();

router.post('/configure', async (req: Request, res: Response) => {
  try {
    const { from, to, matriculaId } = req.body;
    
    if (!from || !to || !matriculaId) {
      return res.status(400).json({
        error: 'Campos obrigatórios: from, to, matriculaId'
      });
    }
    
    // Usar PropertyServiceV2 com sistema de aprovações embutido
    const result = await propertyServiceV2.requestPropertyTransfer(
      from,
      to,
      Number(matriculaId)
    );
    
    res.json({
      success: true,
      message: 'Transferência solicitada com sucesso',
      nextSteps: [
        'Instituição Financeira: POST /api/approvals/v2/transfer/financial/{requestHash}',
        'Cartório: POST /api/approvals/v2/transfer/registry-office/{requestHash}',
        'Prefeitura: POST /api/approvals/v2/transfer/municipality/{requestHash}',
        'Após todas as aprovações, a transferência será executada automaticamente'
      ],
      data: {
        from,
        to,
        matriculaId: Number(matriculaId),
        requestHash: result.requestHash,
        txHash: result.txHash,
        blockNumber: result.blockNumber
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao solicitar transferência',
      details: error.message
    });
  }
});

// ============================================================
// NOTA: As rotas abaixo são do fluxo V1 antigo e não são mais
// necessárias no fluxo V2. O V2 usa aprovações via:
// POST /api/approvals/v2/transfer/financial/{requestHash}
// POST /api/approvals/v2/transfer/registry-office/{requestHash}
// POST /api/approvals/v2/transfer/municipality/{requestHash}
// A execução é AUTOMÁTICA quando todas as aprovações são feitas
// ============================================================

export default router;
