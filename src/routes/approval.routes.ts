import { Router, Request, Response } from 'express';
import { ApprovalService } from '../services/approvalService';

const router = Router();
const approvalService = new ApprovalService();

/**
 * POST /api/approvals/financial
 * Instituição Financeira aprova transferência
 */
router.post('/financial', async (req: Request, res: Response) => {
  try {
    const { from, to, matricula, privateKey } = req.body;

    if (!from || !to || !matricula) {
      return res.status(400).json({
        error: 'Campos obrigatórios: from, to, matricula'
      });
    }

    const txHash = await approvalService.approveAsFinancial(
      from,
      to,
      Number(matricula),
      privateKey
    );

    res.json({
      success: true,
      message: 'Aprovação financeira registrada com sucesso',
      data: {
        from,
        to,
        matricula: Number(matricula),
        approver: 'FINANCIAL',
        txHash
      }
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao registrar aprovação financeira',
      details: error.message
    });
  }
});

/**
 * POST /api/approvals/registry-office
 * Cartório aprova transferência
 */
router.post('/registry-office', async (req: Request, res: Response) => {
  try {
    const { from, to, matricula, privateKey } = req.body;

    if (!from || !to || !matricula) {
      return res.status(400).json({
        error: 'Campos obrigatórios: from, to, matricula'
      });
    }

    const txHash = await approvalService.approveAsRegistryOffice(
      from,
      to,
      Number(matricula),
      privateKey
    );

    res.json({
      success: true,
      message: 'Aprovação do cartório registrada com sucesso',
      data: {
        from,
        to,
        matricula: Number(matricula),
        approver: 'REGISTRY_OFFICE',
        txHash
      }
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao registrar aprovação do cartório',
      details: error.message
    });
  }
});

/**
 * POST /api/approvals/municipality
 * Prefeitura aprova transferência
 */
router.post('/municipality', async (req: Request, res: Response) => {
  try {
    const { from, to, matricula, privateKey } = req.body;

    if (!from || !to || !matricula) {
      return res.status(400).json({
        error: 'Campos obrigatórios: from, to, matricula'
      });
    }

    const txHash = await approvalService.approveAsMunicipality(
      from,
      to,
      Number(matricula),
      privateKey
    );

    res.json({
      success: true,
      message: 'Aprovação da prefeitura registrada com sucesso',
      data: {
        from,
        to,
        matricula: Number(matricula),
        approver: 'MUNICIPALITY',
        txHash
      }
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao registrar aprovação da prefeitura',
      details: error.message
    });
  }
});

/**
 * POST /api/validators/financial
 * Configurar validador da Instituição Financeira
 */
router.post('/validators/financial', async (req: Request, res: Response) => {
  try {
    const { validatorAddress } = req.body;

    if (!validatorAddress) {
      return res.status(400).json({
        error: 'Campo obrigatório: validatorAddress'
      });
    }

    const txHash = await approvalService.setFinancialValidator(validatorAddress);

    res.json({
      success: true,
      message: 'Validador da IF configurado com sucesso',
      data: {
        validatorAddress,
        txHash
      }
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao configurar validador da IF',
      details: error.message
    });
  }
});

/**
 * POST /api/validators/registry-office
 * Configurar validador do Cartório
 */
router.post('/validators/registry-office', async (req: Request, res: Response) => {
  try {
    const { validatorAddress } = req.body;

    if (!validatorAddress) {
      return res.status(400).json({
        error: 'Campo obrigatório: validatorAddress'
      });
    }

    const txHash = await approvalService.setRegistryOfficeValidator(validatorAddress);

    res.json({
      success: true,
      message: 'Validador do cartório configurado com sucesso',
      data: {
        validatorAddress,
        txHash
      }
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao configurar validador do cartório',
      details: error.message
    });
  }
});

/**
 * POST /api/validators/municipality
 * Configurar validador da Prefeitura
 */
router.post('/validators/municipality', async (req: Request, res: Response) => {
  try {
    const { validatorAddress } = req.body;

    if (!validatorAddress) {
      return res.status(400).json({
        error: 'Campo obrigatório: validatorAddress'
      });
    }

    const txHash = await approvalService.setMunicipalityValidator(validatorAddress);

    res.json({
      success: true,
      message: 'Validador da prefeitura configurado com sucesso',
      data: {
        validatorAddress,
        txHash
      }
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao configurar validador da prefeitura',
      details: error.message
    });
  }
});

/**
 * GET /api/validators/financial
 * Obter validador da IF
 */
router.get('/validators/financial', async (req: Request, res: Response) => {
  try {
    const validatorAddress = await approvalService.getFinancialValidator();

    res.json({
      success: true,
      data: {
        validator: 'FINANCIAL',
        address: validatorAddress,
        isConfigured: validatorAddress !== '0x0000000000000000000000000000000000000000'
      }
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao buscar validador da IF',
      details: error.message
    });
  }
});

/**
 * GET /api/validators/registry-office
 * Obter validador do Cartório
 */
router.get('/validators/registry-office', async (req: Request, res: Response) => {
  try {
    const validatorAddress = await approvalService.getRegistryOfficeValidator();

    res.json({
      success: true,
      data: {
        validator: 'REGISTRY_OFFICE',
        address: validatorAddress,
        isConfigured: validatorAddress !== '0x0000000000000000000000000000000000000000'
      }
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao buscar validador do cartório',
      details: error.message
    });
  }
});

/**
 * GET /api/validators/municipality
 * Obter validador da Prefeitura
 */
router.get('/validators/municipality', async (req: Request, res: Response) => {
  try {
    const validatorAddress = await approvalService.getMunicipalityValidator();

    res.json({
      success: true,
      data: {
        validator: 'MUNICIPALITY',
        address: validatorAddress,
        isConfigured: validatorAddress !== '0x0000000000000000000000000000000000000000'
      }
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao buscar validador da prefeitura',
      details: error.message
    });
  }
});

export default router;
