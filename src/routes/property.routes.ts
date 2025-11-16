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

