import { Router, Request, Response } from 'express';
import { PropertyService, PropertyType } from '../services/propertyService';

const router = Router();
const propertyService = new PropertyService();

/**
 * POST /api/properties/register
 * Registrar um novo imóvel (fluxo completo)
 * 
 * Este endpoint executa:
 * 1. Registra propriedade no RegistryMDCompliance
 * 2. Emite título no PropertyTitleTREX
 * 
 * Body:
 * {
 *   "matriculaId": 123456,
 *   "folha": 100,
 *   "comarca": "São Paulo",
 *   "endereco": "Rua Exemplo, 123",
 *   "metragem": 150,
 *   "proprietario": "0x...",
 *   "matriculaOrigem": 0,
 *   "tipo": 0,  // 0=URBANO, 1=RURAL, 2=LITORAL
 *   "isRegular": true
 * }
 */
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
    
    // Validações básicas
    if (!matriculaId || !proprietario || !endereco) {
      return res.status(400).json({
        error: 'Campos obrigatórios: matriculaId, proprietario, endereco'
      });
    }
    
    // Validar tipo
    if (![0, 1, 2].includes(Number(tipo))) {
      return res.status(400).json({
        error: 'Tipo inválido. Use: 0=URBANO, 1=RURAL, 2=LITORAL'
      });
    }
    
    const result = await propertyService.registerProperty({
      matriculaId: Number(matriculaId),
      folha: Number(folha || 1),
      comarca: comarca || 'Não informada',
      endereco,
      metragem: Number(metragem || 0),
      proprietario,
      matriculaOrigem: Number(matriculaOrigem),
      tipo: Number(tipo) as PropertyType,
      isRegular: Boolean(isRegular)
    });
    
    res.json({
      success: true,
      message: 'Imóvel registrado e título emitido com sucesso',
      data: {
        matriculaId: result.matriculaId,
        owner: result.owner,
        complianceTxHash: result.complianceTxHash,
        issueTxHash: result.issueTxHash
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
 * GET /api/properties/:matriculaId
 * Consultar dados completos de um imóvel
 * Retorna informações do compliance + token
 */
router.get('/:matriculaId', async (req: Request, res: Response) => {
  try {
    const { matriculaId } = req.params;
    const details = await propertyService.getPropertyDetails(Number(matriculaId));
    
    res.json({
      success: true,
      data: {
        ...details.complianceInfo,
        currentOwner: details.owner,
        exists: details.exists,
        frozen: details.frozen,
        typeName: PropertyType[details.complianceInfo.tipo]
      }
    });
    
  } catch (error: any) {
    res.status(404).json({
      error: 'Propriedade não encontrada',
      details: error.message
    });
  }
});

/**
 * GET /api/properties/compliance/:matriculaId
 * Consultar apenas dados do módulo de compliance
 */
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

/**
 * GET /api/properties/owner/:address
 * Listar todas as propriedades de um dono
 */
router.get('/owner/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const matriculas = await propertyService.getPropertiesOfOwner(address);
    
    // Buscar detalhes de cada propriedade
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

/**
 * GET /api/properties/:matriculaId/owner
 * Verificar quem é o dono atual de uma propriedade
 */
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

/**
 * GET /api/properties/:matriculaId/exists
 * Verificar se uma propriedade existe
 */
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

/**
 * GET /api/properties/:matriculaId/frozen
 * Verificar se uma propriedade está congelada
 */
router.get('/:matriculaId/frozen', async (req: Request, res: Response) => {
  try {
    const { matriculaId } = req.params;
    const frozen = await propertyService.isPropertyFrozen(Number(matriculaId));
    
    res.json({
      success: true,
      matriculaId: Number(matriculaId),
      frozen,
      message: frozen ? '❄️ Propriedade congelada - Transferências bloqueadas' : '✅ Propriedade regular'
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao verificar freeze',
      details: error.message
    });
  }
});

/**
 * PUT /api/properties/:matriculaId
 * Atualizar informações cadastrais de uma propriedade
 * 
 * Body:
 * {
 *   "endereco": "Novo endereço",
 *   "metragem": 200,
 *   "isRegular": true
 * }
 */
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

