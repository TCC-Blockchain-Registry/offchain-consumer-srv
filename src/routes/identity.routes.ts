import { Router, Request, Response } from 'express';
import { registerIdentity, verifyIdentity } from '../services/identityService';

const router = Router();

/**
 * POST /api/identity/register
 * Registra identidade de um wallet no Identity Registry
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { walletAddress, countryCode = 76 } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        error: 'Wallet address é obrigatório',
        example: {
          walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          countryCode: 76
        }
      });
    }

    // Validar formato do endereço
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        error: 'Formato de endereço inválido',
        details: 'Deve começar com 0x e ter 40 caracteres hexadecimais'
      });
    }

    const result = await registerIdentity(walletAddress);

    if (result.alreadyRegistered) {
      return res.json({
        success: true,
        message: 'Identidade já estava registrada',
        data: {
          walletAddress,
          alreadyRegistered: true
        }
      });
    }

    res.json({
      success: true,
      message: 'Identidade registrada com sucesso',
      data: {
        walletAddress,
        txHash: result.txHash,
        blockNumber: result.blockNumber
      }
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao registrar identidade',
      details: error.message
    });
  }
});

/**
 * GET /api/identity/:walletAddress/verify
 * Verifica se um wallet tem identidade registrada
 */
router.get('/:walletAddress/verify', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        error: 'Formato de endereço inválido'
      });
    }

    const result = await verifyIdentity(walletAddress);

    res.json({
      success: true,
      data: {
        walletAddress,
        isVerified: result.isVerified,
        identityContract: result.identityContract
      }
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao verificar identidade',
      details: error.message
    });
  }
});

export default router;
