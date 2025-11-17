import { Router, Request, Response } from 'express';
import { propertyServiceV2 } from '../services/propertyServiceV2';

const router = Router();

/**
 * @route POST /api/approvals/registration/request
 * @desc Solicita registro de propriedade (fica pendente)
 */
router.post('/registration/request', async (req: Request, res: Response) => {
  try {
    const { matriculaId, beneficiary } = req.body;

    if (!matriculaId || !beneficiary) {
      return res.status(400).json({
        error: 'Campos obrigatórios: matriculaId, beneficiary'
      });
    }

    const result = await propertyServiceV2.requestPropertyRegistration(
      Number(matriculaId),
      beneficiary
    );

    res.json({
      message: 'Solicitação de registro criada com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('Erro ao solicitar registro:', error);
    res.status(500).json({
      error: 'Falha ao solicitar registro',
      details: error.message
    });
  }
});

/**
 * @route POST /api/approvals/registration/:requestHash/financial
 * @desc Aprova registro como Instituição Financeira
 */
router.post('/registration/:requestHash/financial', async (req: Request, res: Response) => {
  try {
    const { requestHash } = req.params;

    const result = await propertyServiceV2.approveRegistrationAsFinancial(requestHash);

    res.json({
      message: 'Registro aprovado pela Instituição Financeira',
      data: result
    });

  } catch (error: any) {
    console.error('Erro ao aprovar (financial):', error);
    res.status(500).json({
      error: 'Falha na aprovação financeira',
      details: error.message
    });
  }
});

/**
 * @route POST /api/approvals/registration/:requestHash/registry-office
 * @desc Aprova registro como Cartório
 */
router.post('/registration/:requestHash/registry-office', async (req: Request, res: Response) => {
  try {
    const { requestHash } = req.params;

    const result = await propertyServiceV2.approveRegistrationAsRegistryOffice(requestHash);

    res.json({
      message: 'Registro aprovado pelo Cartório',
      data: result
    });

  } catch (error: any) {
    console.error('Erro ao aprovar (registry):', error);
    res.status(500).json({
      error: 'Falha na aprovação do cartório',
      details: error.message
    });
  }
});

/**
 * @route POST /api/approvals/registration/:requestHash/municipality
 * @desc Aprova registro como Prefeitura
 */
router.post('/registration/:requestHash/municipality', async (req: Request, res: Response) => {
  try {
    const { requestHash } = req.params;

    const result = await propertyServiceV2.approveRegistrationAsMunicipality(requestHash);

    res.json({
      message: 'Registro aprovado pela Prefeitura',
      data: result
    });

  } catch (error: any) {
    console.error('Erro ao aprovar (municipality):', error);
    res.status(500).json({
      error: 'Falha na aprovação da prefeitura',
      details: error.message
    });
  }
});

// NOTA: Execute endpoints foram removidos pois a execução é AUTOMÁTICA
// após a 3ª aprovação (Financial + Registry + Municipality)

/**
 * @route GET /api/approvals/registration/:requestHash/status
 * @desc Consulta status de um registro pendente
 */
router.get('/registration/:requestHash/status', async (req: Request, res: Response) => {
  try {
    const { requestHash } = req.params;

    const status = await propertyServiceV2.getRegistrationStatus(requestHash);

    if (!status.exists) {
      return res.status(404).json({
        error: 'Solicitação de registro não encontrada'
      });
    }

    res.json({
      requestHash,
      status
    });

  } catch (error: any) {
    console.error('Erro ao consultar status:', error);
    res.status(500).json({
      error: 'Falha ao consultar status',
      details: error.message
    });
  }
});

/**
 * @route POST /api/approvals/transfer/request
 * @desc Solicita transferência de propriedade (fica pendente)
 */
router.post('/transfer/request', async (req: Request, res: Response) => {
  try {
    const { from, to, matriculaId } = req.body;

    if (!from || !to || !matriculaId) {
      return res.status(400).json({
        error: 'Campos obrigatórios: from, to, matriculaId'
      });
    }

    const result = await propertyServiceV2.requestPropertyTransfer(
      from,
      to,
      Number(matriculaId)
    );

    res.json({
      message: 'Solicitação de transferência criada com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('Erro ao solicitar transferência:', error);
    res.status(500).json({
      error: 'Falha ao solicitar transferência',
      details: error.message
    });
  }
});

/**
 * @route POST /api/approvals/transfer/:requestHash/financial
 * @desc Aprova transferência como Instituição Financeira
 */
router.post('/transfer/:requestHash/financial', async (req: Request, res: Response) => {
  try {
    const { requestHash } = req.params;

    const result = await propertyServiceV2.approveTransferAsFinancial(requestHash);

    res.json({
      message: 'Transferência aprovada pela Instituição Financeira',
      data: result
    });

  } catch (error: any) {
    console.error('Erro ao aprovar transferência (financial):', error);
    res.status(500).json({
      error: 'Falha na aprovação financeira',
      details: error.message
    });
  }
});

/**
 * @route POST /api/approvals/transfer/:requestHash/registry-office
 * @desc Aprova transferência como Cartório
 */
router.post('/transfer/:requestHash/registry-office', async (req: Request, res: Response) => {
  try {
    const { requestHash } = req.params;

    const result = await propertyServiceV2.approveTransferAsRegistryOffice(requestHash);

    res.json({
      message: 'Transferência aprovada pelo Cartório',
      data: result
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Falha na aprovação do cartório',
      details: error.message
    });
  }
});

/**
 * @route POST /api/approvals/transfer/:requestHash/municipality
 * @desc Aprova transferência como Prefeitura
 */
router.post('/transfer/:requestHash/municipality', async (req: Request, res: Response) => {
  try {
    const { requestHash } = req.params;

    const result = await propertyServiceV2.approveTransferAsMunicipality(requestHash);

    res.json({
      message: 'Transferência aprovada pela Prefeitura',
      data: result
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Falha na aprovação da prefeitura',
      details: error.message
    });
  }
});

// Execute transfer também é AUTOMÁTICO após 3ª aprovação

/**
 * @route GET /api/approvals/transfer/:requestHash/status
 * @desc Consulta status de uma transferência pendente
 */
router.get('/transfer/:requestHash/status', async (req: Request, res: Response) => {
  try {
    const { requestHash } = req.params;

    const status = await propertyServiceV2.getTransferStatus(requestHash);

    if (!status.exists) {
      return res.status(404).json({
        error: 'Solicitação de transferência não encontrada'
      });
    }

    res.json({
      requestHash,
      status
    });

  } catch (error: any) {
    console.error('Erro ao consultar status:', error);
    res.status(500).json({
      error: 'Falha ao consultar status',
      details: error.message
    });
  }
});

export default router;

