import { Router, Request, Response } from 'express';
import { PropertyService, PropertyType } from '../services/propertyService';

const router = Router();
const propertyService = new PropertyService();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      matriculaId,
      folha,
      comarca,
      endereco,
      metragem,
      proprietario,
      matriculaOrigem = 0,
      tipo = PropertyType.URBANO,
      isRegular = true
    } = req.body;

    if (!matriculaId || !proprietario || !endereco) {
      return res.status(400).json({
        error: 'Campos obrigatórios: matriculaId, proprietario, endereco'
      });
    }

    if (![0, 1, 2].includes(Number(tipo))) {
      return res.status(400).json({
        error: 'Tipo inválido. Use: 0=URBANO, 1=RURAL, 2=LITORAL'
      });
    }

    const result = await propertyService.requestPropertyRegistration(
      Number(matriculaId),
      proprietario
    );

    res.json({
      success: true,
      message: 'Solicitação de registro criada com sucesso. Aguardando aprovações.',
      data: {
        requestHash: result.requestHash,
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        matriculaId: Number(matriculaId),
        beneficiary: proprietario,
        status: 'PENDING_APPROVALS',
        nextSteps: [
          'Aprovação Financial (Instituição Financeira)',
          'Aprovação Registry Office (Cartório)',
          'Aprovação Municipality (Prefeitura)',
          'Execução automática após todas as aprovações'
        ]
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao registrar imóvel',
      details: error.message
    });
  }
});

/**
 * @route POST /api/properties/approvals/request
 * @desc Solicita aprovação de registro de propriedade (fluxo de aprovações)
 */
router.post('/approvals/request', async (req: Request, res: Response) => {
  try {
    const { matriculaId, beneficiary } = req.body;

    if (!matriculaId || !beneficiary) {
      return res.status(400).json({
        error: 'Campos obrigatórios: matriculaId, beneficiary'
      });
    }

    const result = await propertyService.requestPropertyRegistration(
      Number(matriculaId),
      beneficiary
    );

    res.json({
      success: true,
      message: 'Solicitação de aprovação criada com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('Erro ao solicitar aprovação:', error);
    res.status(500).json({
      success: false,
      error: 'Falha ao solicitar aprovação',
      details: error.message
    });
  }
});

/**
 * @route POST /api/properties/approvals/:requestHash/financial
 * @desc Aprova registro como Instituição Financeira
 */
router.post('/approvals/:requestHash/financial', async (req: Request, res: Response) => {
  try {
    const { requestHash } = req.params;

    const result = await propertyService.approveAsFinancial(requestHash);

    res.json({
      success: true,
      message: 'Registro aprovado pela Instituição Financeira',
      data: result
    });

  } catch (error: any) {
    console.error('Erro ao aprovar (financial):', error);
    res.status(500).json({
      success: false,
      error: 'Falha na aprovação financeira',
      details: error.message
    });
  }
});

/**
 * @route POST /api/properties/approvals/:requestHash/registry-office
 * @desc Aprova registro como Cartório
 */
router.post('/approvals/:requestHash/registry-office', async (req: Request, res: Response) => {
  try {
    const { requestHash } = req.params;

    const result = await propertyService.approveAsRegistryOffice(requestHash);

    res.json({
      success: true,
      message: 'Registro aprovado pelo Cartório',
      data: result
    });

  } catch (error: any) {
    console.error('Erro ao aprovar (registry):', error);
    res.status(500).json({
      success: false,
      error: 'Falha na aprovação do cartório',
      details: error.message
    });
  }
});

/**
 * @route POST /api/properties/approvals/:requestHash/municipality
 * @desc Aprova registro como Prefeitura (auto-executa quando última aprovação)
 */
router.post('/approvals/:requestHash/municipality', async (req: Request, res: Response) => {
  try {
    const { requestHash } = req.params;

    const result = await propertyService.approveAsMunicipality(requestHash);

    res.json({
      success: true,
      message: 'Registro aprovado pela Prefeitura (auto-executado)',
      data: result
    });

  } catch (error: any) {
    console.error('Erro ao aprovar (municipality):', error);
    res.status(500).json({
      success: false,
      error: 'Falha na aprovação da prefeitura',
      details: error.message
    });
  }
});

/**
 * @route GET /api/properties/approvals/:requestHash/status
 * @desc Consulta status de uma aprovação de registro pendente
 */
router.get('/approvals/:requestHash/status', async (req: Request, res: Response) => {
  try {
    const { requestHash } = req.params;

    const status = await propertyService.getRegistrationStatus(requestHash);

    if (!status.exists) {
      return res.status(404).json({
        success: false,
        error: 'Solicitação de aprovação não encontrada'
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

// Generic route with :matriculaId parameter MUST be after all specific routes
router.get('/:matriculaId', async (req: Request, res: Response) => {
  try {
    const { matriculaId } = req.params;
    const details = await propertyService.getPropertyDetails(Number(matriculaId));

    res.json({
      success: true,
      data: {
        matriculaId: Number(matriculaId),
        currentOwner: details.owner,
        exists: details.exists,
        hasComplianceData: details.complianceInfo !== null,
        complianceInfo: details.complianceInfo ? {
          ...details.complianceInfo,
          typeName: PropertyType[details.complianceInfo.tipo]
        } : null
      }
    });

  } catch (error: any) {
    res.status(404).json({
      error: 'Propriedade não encontrada',
      details: error.message
    });
  }
});


// Specific routes MUST come before generic /:matriculaId route
router.get('/compliance/:matriculaId', async (req: Request, res: Response) => {
  try {
    const { matriculaId } = req.params;
    const property = await propertyService.getPropertyFromCompliance(Number(matriculaId));

    res.json({
      success: true,
      data: {
        ...property,
        typeName: PropertyType[property.tipo]
      }
    });

  } catch (error: any) {
    res.status(404).json({
      error: 'Propriedade não encontrada no compliance',
      details: error.message
    });
  }
});

router.get('/owner/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const matriculas = await propertyService.getPropertiesOfOwner(address);

    const properties = await Promise.all(
      matriculas.map(async (matriculaId) => {
        try {
          return await propertyService.getPropertyDetails(matriculaId);
        } catch {
          return null;
        }
      })
    );

    const validProperties = properties.filter(p => p !== null);

    res.json({
      success: true,
      owner: address,
      count: validProperties.length,
      matriculas,
      properties: validProperties
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao buscar propriedades',
      details: error.message
    });
  }
});

router.get('/count/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const count = await propertyService.propertyCountOf(address);

    res.json({
      success: true,
      owner: address,
      propertyCount: count
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao contar propriedades',
      details: error.message
    });
  }
});


router.get('/:matriculaId/owner', async (req: Request, res: Response) => {
  try {
    const { matriculaId } = req.params;
    const owner = await propertyService.getPropertyOwner(Number(matriculaId));
    
    res.json({
      success: true,
      matriculaId: Number(matriculaId),
      owner
    });
    
  } catch (error: any) {
    res.status(404).json({
      error: 'Erro ao buscar dono',
      details: error.message
    });
  }
});

router.get('/:matriculaId/exists', async (req: Request, res: Response) => {
  try {
    const { matriculaId } = req.params;
    const exists = await propertyService.propertyExists(Number(matriculaId));
    
    res.json({
      success: true,
      matriculaId: Number(matriculaId),
      exists
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao verificar existência',
      details: error.message
    });
  }
});

router.put('/:matriculaId', async (req: Request, res: Response) => {
  try {
    const { matriculaId } = req.params;
    const { endereco, metragem, isRegular } = req.body;

    if (!endereco || !metragem || isRegular === undefined) {
      return res.status(400).json({
        error: 'Campos obrigatórios: endereco, metragem, isRegular'
      });
    }

    const txHash = await propertyService.updateProperty(
      Number(matriculaId),
      endereco,
      Number(metragem),
      Boolean(isRegular)
    );

    res.json({
      success: true,
      message: 'Propriedade atualizada',
      matriculaId: Number(matriculaId),
      txHash
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao atualizar propriedade',
      details: error.message
    });
  }
});

export default router;

