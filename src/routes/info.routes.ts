import { Router, Request, Response } from 'express';
import { InfoService } from '../services/infoService';

const router = Router();
const infoService = new InfoService();

// Read-Only Getters
router.get('/name', async (req: Request, res: Response) => {
  try {
    const name = await infoService.name();
    res.json({ success: true, name });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar nome', details: error.message });
  }
});

router.get('/symbol', async (req: Request, res: Response) => {
  try {
    const symbol = await infoService.symbol();
    res.json({ success: true, symbol });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar símbolo', details: error.message });
  }
});

router.get('/decimals', async (req: Request, res: Response) => {
  try {
    const decimals = await infoService.decimals();
    res.json({ success: true, decimals });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar decimais', details: error.message });
  }
});

router.get('/total-supply', async (req: Request, res: Response) => {
  try {
    const totalSupply = await infoService.totalSupply();
    res.json({ success: true, totalSupply });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar total supply', details: error.message });
  }
});

router.get('/version', async (req: Request, res: Response) => {
  try {
    const version = await infoService.version();
    res.json({ success: true, version });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar versão', details: error.message });
  }
});

router.get('/identity-registry', async (req: Request, res: Response) => {
  try {
    const identityRegistry = await infoService.identityRegistry();
    res.json({ success: true, identityRegistry });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar identity registry', details: error.message });
  }
});

router.get('/compliance', async (req: Request, res: Response) => {
  try {
    const compliance = await infoService.compliance();
    res.json({ success: true, compliance });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar compliance', details: error.message });
  }
});

router.get('/onchain-id', async (req: Request, res: Response) => {
  try {
    const onchainID = await infoService.onchainID();
    res.json({ success: true, onchainID });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar onchain ID', details: error.message });
  }
});

// Configuration Setters
router.put('/identity-registry', async (req: Request, res: Response) => {
  try {
    const { registryAddress } = req.body;
    if (!registryAddress) return res.status(400).json({ error: 'Campo obrigatório: registryAddress' });

    const txHash = await infoService.setIdentityRegistry(registryAddress);
    res.json({ success: true, message: 'Identity Registry configurado', registryAddress, txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao configurar identity registry', details: error.message });
  }
});

router.put('/compliance', async (req: Request, res: Response) => {
  try {
    const { complianceAddress } = req.body;
    if (!complianceAddress) return res.status(400).json({ error: 'Campo obrigatório: complianceAddress' });

    const txHash = await infoService.setCompliance(complianceAddress);
    res.json({ success: true, message: 'Compliance configurado', complianceAddress, txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao configurar compliance', details: error.message });
  }
});

router.put('/name', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Campo obrigatório: name' });

    const txHash = await infoService.setName(name);
    res.json({ success: true, message: 'Nome configurado', name, txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao configurar nome', details: error.message });
  }
});

router.put('/symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ error: 'Campo obrigatório: symbol' });

    const txHash = await infoService.setSymbol(symbol);
    res.json({ success: true, message: 'Símbolo configurado', symbol, txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao configurar símbolo', details: error.message });
  }
});

router.put('/onchain-id', async (req: Request, res: Response) => {
  try {
    const { onchainIDAddress } = req.body;
    if (!onchainIDAddress) return res.status(400).json({ error: 'Campo obrigatório: onchainIDAddress' });

    const txHash = await infoService.setOnchainID(onchainIDAddress);
    res.json({ success: true, message: 'OnchainID configurado', onchainIDAddress, txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao configurar onchain ID', details: error.message });
  }
});

export default router;
