import { Router, Request, Response } from 'express';
import { transferService } from '../services/transferService';

const router = Router();

/**
 * @route POST /api/transfers/request
 * @desc Solicita transferência de propriedade (fica pendente até aprovações)
 */
router.post('/request', async (req: Request, res: Response) => {
  try {
    const { from, to, matriculaId } = req.body;

    if (!from || !to || !matriculaId) {
      return res.status(400).json({
        error: 'Campos obrigatórios: from, to, matriculaId'
      });
    }

    const result = await transferService.requestPropertyTransfer(
      from,
      to,
      Number(matriculaId)
    );

    res.json({
      success: true,
      message: 'Solicitação de transferência criada com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('Erro ao solicitar transferência:', error);
    res.status(500).json({
      success: false,
      error: 'Falha ao solicitar transferência',
      details: error.message
    });
  }
});

/**
 * @route POST /api/transfers/approvals/:requestHash/financial
 * @desc Aprova transferência como Instituição Financeira
 */
router.post('/approvals/:requestHash/financial', async (req: Request, res: Response) => {
  try {
    const { requestHash } = req.params;

    const result = await transferService.approveAsFinancial(requestHash);

    res.json({
      success: true,
      message: 'Transferência aprovada pela Instituição Financeira',
      data: result
    });

  } catch (error: any) {
    console.error('Erro ao aprovar transferência (financial):', error);
    res.status(500).json({
      success: false,
      error: 'Falha na aprovação financeira',
      details: error.message
    });
  }
});

/**
 * @route POST /api/transfers/approvals/:requestHash/registry-office
 * @desc Aprova transferência como Cartório
 */
router.post('/approvals/:requestHash/registry-office', async (req: Request, res: Response) => {
  try {
    const { requestHash } = req.params;

    const result = await transferService.approveAsRegistryOffice(requestHash);

    res.json({
      success: true,
      message: 'Transferência aprovada pelo Cartório',
      data: result
    });

  } catch (error: any) {
    console.error('Erro ao aprovar transferência (registry):', error);
    res.status(500).json({
      success: false,
      error: 'Falha na aprovação do cartório',
      details: error.message
    });
  }
});

/**
 * @route POST /api/transfers/approvals/:requestHash/municipality
 * @desc Aprova transferência como Prefeitura (auto-executa quando última aprovação)
 */
router.post('/approvals/:requestHash/municipality', async (req: Request, res: Response) => {
  try {
    const { requestHash } = req.params;

    const result = await transferService.approveAsMunicipality(requestHash);

    res.json({
      success: true,
      message: 'Transferência aprovada pela Prefeitura (auto-executada)',
      data: result
    });

  } catch (error: any) {
    console.error('Erro ao aprovar transferência (municipality):', error);
    res.status(500).json({
      success: false,
      error: 'Falha na aprovação da prefeitura',
      details: error.message
    });
  }
});

/**
 * @route GET /api/transfers/approvals/:requestHash/status
 * @desc Consulta status de uma transferência pendente
 */
router.get('/approvals/:requestHash/status', async (req: Request, res: Response) => {
  try {
    const { requestHash } = req.params;

    const status = await transferService.getTransferStatus(requestHash);

    if (!status.exists) {
      return res.status(404).json({
        success: false,
        error: 'Solicitação de transferência não encontrada'
      });
    }

    res.json({
      success: true,
      requestHash,
      status
    });

  } catch (error: any) {
    console.error('Erro ao consultar status:', error);
    res.status(500).json({
      success: false,
      error: 'Falha ao consultar status',
      details: error.message
    });
  }
});

export default router;
