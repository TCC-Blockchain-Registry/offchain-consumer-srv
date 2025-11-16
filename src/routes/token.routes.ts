import { Router, Request, Response } from 'express';
import { TokenService } from '../services/tokenService';

const router = Router();
const tokenService = new TokenService();

router.post('/mint', async (req: Request, res: Response) => {
  try {
    const { to, amount } = req.body;
    if (!to || !amount) return res.status(400).json({ error: 'Campos obrigatórios: to, amount' });

    const txHash = await tokenService.mint(to, Number(amount));
    res.json({ success: true, message: 'Tokens mintados', to, amount: Number(amount), txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao mintar tokens', details: error.message });
  }
});

router.post('/burn', async (req: Request, res: Response) => {
  try {
    const { address, amount } = req.body;
    if (!address || !amount) return res.status(400).json({ error: 'Campos obrigatórios: address, amount' });

    const txHash = await tokenService.burn(address, Number(amount));
    res.json({ success: true, message: 'Tokens queimados', address, amount: Number(amount), txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao queimar tokens', details: error.message });
  }
});

router.post('/batch-mint', async (req: Request, res: Response) => {
  try {
    const { addresses, amounts } = req.body;
    if (!addresses || !amounts || !Array.isArray(addresses) || !Array.isArray(amounts)) {
      return res.status(400).json({ error: 'Campos obrigatórios: addresses (array), amounts (array)' });
    }

    const txHash = await tokenService.batchMint(addresses, amounts.map(Number));
    res.json({ success: true, message: 'Batch mint executado', count: addresses.length, txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro no batch mint', details: error.message });
  }
});

router.post('/batch-burn', async (req: Request, res: Response) => {
  try {
    const { addresses, amounts } = req.body;
    if (!addresses || !amounts || !Array.isArray(addresses) || !Array.isArray(amounts)) {
      return res.status(400).json({ error: 'Campos obrigatórios: addresses (array), amounts (array)' });
    }

    const txHash = await tokenService.batchBurn(addresses, amounts.map(Number));
    res.json({ success: true, message: 'Batch burn executado', count: addresses.length, txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro no batch burn', details: error.message });
  }
});

router.post('/forced-transfer', async (req: Request, res: Response) => {
  try {
    const { from, to, amount } = req.body;
    if (!from || !to || !amount) return res.status(400).json({ error: 'Campos obrigatórios: from, to, amount' });

    const txHash = await tokenService.forcedTransfer(from, to, Number(amount));
    res.json({ success: true, message: 'Transferência forçada executada', from, to, amount: Number(amount), txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro na transferência forçada', details: error.message });
  }
});

router.post('/batch-forced-transfer', async (req: Request, res: Response) => {
  try {
    const { from, to, amounts } = req.body;
    if (!from || !to || !amounts || !Array.isArray(from) || !Array.isArray(to) || !Array.isArray(amounts)) {
      return res.status(400).json({ error: 'Campos obrigatórios: from (array), to (array), amounts (array)' });
    }

    if (from.length !== to.length || from.length !== amounts.length) {
      return res.status(400).json({
        error: 'Arrays devem ter o mesmo tamanho',
        details: `from: ${from.length}, to: ${to.length}, amounts: ${amounts.length}`
      });
    }

    const txHash = await tokenService.batchForcedTransfer(from, to, amounts.map(Number));
    res.json({ success: true, message: 'Batch forced transfer executado', count: from.length, txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro no batch forced transfer', details: error.message });
  }
});

router.post('/batch-transfer', async (req: Request, res: Response) => {
  try {
    const { to, amounts, privateKey } = req.body;
    if (!to || !amounts || !Array.isArray(to) || !Array.isArray(amounts)) {
      return res.status(400).json({ error: 'Campos obrigatórios: to (array), amounts (array)' });
    }

    const txHash = await tokenService.batchTransfer(to, amounts.map(Number), privateKey);
    res.json({ success: true, message: 'Batch transfer executado', count: to.length, txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro no batch transfer', details: error.message });
  }
});

router.post('/recovery', async (req: Request, res: Response) => {
  try {
    const { lostWallet, newWallet, onchainID } = req.body;
    if (!lostWallet || !newWallet || !onchainID) {
      return res.status(400).json({ error: 'Campos obrigatórios: lostWallet, newWallet, onchainID' });
    }

    const txHash = await tokenService.recoveryAddress(lostWallet, newWallet, onchainID);
    res.json({ success: true, message: 'Endereço recuperado', lostWallet, newWallet, txHash });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro na recuperação', details: error.message });
  }
});

export default router;
