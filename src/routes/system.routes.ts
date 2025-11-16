import { Router, Request, Response } from 'express';
import { SystemService } from '../services/systemService';

const router = Router();
const systemService = new SystemService();

// Pause/Unpause
router.post('/pause', async (req: Request, res: Response) => {
  try {
    const txHash = await systemService.pause();
    res.json({ success: true, message: '⏸️ Sistema pausado', txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao pausar sistema', details: error.message });
  }
});

router.post('/unpause', async (req: Request, res: Response) => {
  try {
    const txHash = await systemService.unpause();
    res.json({ success: true, message: '▶️ Sistema ativo', txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao despausar sistema', details: error.message });
  }
});

router.get('/paused', async (req: Request, res: Response) => {
  try {
    const isPaused = await systemService.paused();
    res.json({ success: true, isPaused, message: isPaused ? '⏸️ Pausado' : '▶️ Ativo' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao verificar pausa', details: error.message });
  }
});

// Agent Management
router.post('/agents/add', async (req: Request, res: Response) => {
  try {
    const { agentAddress } = req.body;
    if (!agentAddress) return res.status(400).json({ error: 'Campo obrigatório: agentAddress' });

    const txHash = await systemService.addAgent(agentAddress);
    res.json({ success: true, message: 'Agente adicionado', agentAddress, txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao adicionar agente', details: error.message });
  }
});

router.post('/agents/remove', async (req: Request, res: Response) => {
  try {
    const { agentAddress } = req.body;
    if (!agentAddress) return res.status(400).json({ error: 'Campo obrigatório: agentAddress' });

    const txHash = await systemService.removeAgent(agentAddress);
    res.json({ success: true, message: 'Agente removido', agentAddress, txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao remover agente', details: error.message });
  }
});

router.get('/agents/is-agent/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const isAgent = await systemService.isAgent(address);
    res.json({ success: true, address, isAgent });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao verificar agente', details: error.message });
  }
});

// Address Freezing
router.post('/addresses/freeze', async (req: Request, res: Response) => {
  try {
    const { address, freeze } = req.body;
    if (!address || freeze === undefined) {
      return res.status(400).json({ error: 'Campos obrigatórios: address, freeze' });
    }

    const txHash = await systemService.setAddressFrozen(address, Boolean(freeze));
    res.json({ success: true, message: freeze ? '❄️ Congelado' : '🔥 Descongelado', address, freeze: Boolean(freeze), txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao congelar endereço', details: error.message });
  }
});

router.post('/addresses/batch-freeze', async (req: Request, res: Response) => {
  try {
    const { addresses, freeze } = req.body;
    if (!addresses || !Array.isArray(addresses) || !Array.isArray(freeze)) {
      return res.status(400).json({ error: 'Campos obrigatórios: addresses (array), freeze (array)' });
    }

    if (addresses.length !== freeze.length) {
      return res.status(400).json({
        error: 'Arrays devem ter o mesmo tamanho',
        details: `addresses: ${addresses.length}, freeze: ${freeze.length}`
      });
    }

    const txHash = await systemService.batchSetAddressFrozen(addresses, freeze);
    res.json({ success: true, message: 'Batch freeze executado', count: addresses.length, txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro no batch freeze', details: error.message });
  }
});

router.post('/addresses/freeze-partial', async (req: Request, res: Response) => {
  try {
    const { address, amount } = req.body;
    if (!address || !amount) {
      return res.status(400).json({ error: 'Campos obrigatórios: address, amount' });
    }

    const txHash = await systemService.freezePartialTokens(address, Number(amount));
    res.json({ success: true, message: '❄️ Tokens congelados', address, amount: Number(amount), txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao congelar tokens', details: error.message });
  }
});

router.post('/addresses/unfreeze-partial', async (req: Request, res: Response) => {
  try {
    const { address, amount } = req.body;
    if (!address || !amount) {
      return res.status(400).json({ error: 'Campos obrigatórios: address, amount' });
    }

    const txHash = await systemService.unfreezePartialTokens(address, Number(amount));
    res.json({ success: true, message: '🔥 Tokens descongelados', address, amount: Number(amount), txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao descongelar tokens', details: error.message });
  }
});

router.post('/addresses/batch-freeze-partial', async (req: Request, res: Response) => {
  try {
    const { addresses, amounts } = req.body;
    if (!addresses || !amounts || !Array.isArray(addresses) || !Array.isArray(amounts)) {
      return res.status(400).json({ error: 'Campos obrigatórios: addresses (array), amounts (array)' });
    }

    if (addresses.length !== amounts.length) {
      return res.status(400).json({
        error: 'Arrays devem ter o mesmo tamanho',
        details: `addresses: ${addresses.length}, amounts: ${amounts.length}`
      });
    }

    const txHash = await systemService.batchFreezePartialTokens(addresses, amounts.map(Number));
    res.json({ success: true, message: 'Batch freeze partial executado', count: addresses.length, txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro no batch freeze partial', details: error.message });
  }
});

router.post('/addresses/batch-unfreeze-partial', async (req: Request, res: Response) => {
  try {
    const { addresses, amounts } = req.body;
    if (!addresses || !amounts || !Array.isArray(addresses) || !Array.isArray(amounts)) {
      return res.status(400).json({ error: 'Campos obrigatórios: addresses (array), amounts (array)' });
    }

    if (addresses.length !== amounts.length) {
      return res.status(400).json({
        error: 'Arrays devem ter o mesmo tamanho',
        details: `addresses: ${addresses.length}, amounts: ${amounts.length}`
      });
    }

    const txHash = await systemService.batchUnfreezePartialTokens(addresses, amounts.map(Number));
    res.json({ success: true, message: 'Batch unfreeze partial executado', count: addresses.length, txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro no batch unfreeze partial', details: error.message });
  }
});

router.get('/addresses/:address/frozen-tokens', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const frozenTokens = await systemService.getFrozenTokens(address);
    res.json({ success: true, address, frozenTokens });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar tokens congelados', details: error.message });
  }
});

router.get('/addresses/:address/is-frozen', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const isFrozen = await systemService.isFrozen(address);
    res.json({ success: true, address, isFrozen, message: isFrozen ? '❄️ Congelado' : '✅ Ativo' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao verificar freeze', details: error.message });
  }
});

export default router;
