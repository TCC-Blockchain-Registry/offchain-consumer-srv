import { Router, Request, Response } from 'express';
import { RoleManagerService, SystemRole } from '../services/roleManagerService';

const router = Router();
const roleManager = new RoleManagerService();

/**
 * @route POST /api/admin/grant-role
 * @desc Concede uma role para um endereço
 * @body { roleName: string, address: string }
 */
router.post('/grant-role', async (req: Request, res: Response) => {
  try {
    const { roleName, address } = req.body;

    if (!roleName || !address) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: roleName, address'
      });
    }

    // Validar formato do endereço
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Endereço inválido. Use formato: 0x...'
      });
    }

    // Validar role name
    const validRoles = Object.values(SystemRole);
    if (!validRoles.includes(roleName as SystemRole)) {
      return res.status(400).json({
        success: false,
        error: `Role inválida. Roles disponíveis: ${validRoles.join(', ')}`
      });
    }

    const result = await roleManager.grantRole(roleName, address);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Falha ao conceder role',
        details: result
      });
    }

    res.json({
      success: true,
      message: result.alreadyGranted
        ? `${address} já possui ${roleName}`
        : `${roleName} concedida para ${address}`,
      data: {
        roleName: result.roleName,
        roleHash: result.roleHash,
        address: result.address,
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        alreadyGranted: result.alreadyGranted
      }
    });

  } catch (error: any) {
    console.error('Erro ao conceder role:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao conceder role',
      details: error.message
    });
  }
});

/**
 * @route POST /api/admin/revoke-role
 * @desc Revoga uma role de um endereço
 * @body { roleName: string, address: string }
 */
router.post('/revoke-role', async (req: Request, res: Response) => {
  try {
    const { roleName, address } = req.body;

    if (!roleName || !address) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: roleName, address'
      });
    }

    // Validar formato do endereço
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Endereço inválido. Use formato: 0x...'
      });
    }

    // Validar role name
    const validRoles = Object.values(SystemRole);
    if (!validRoles.includes(roleName as SystemRole)) {
      return res.status(400).json({
        success: false,
        error: `Role inválida. Roles disponíveis: ${validRoles.join(', ')}`
      });
    }

    const result = await roleManager.revokeRole(roleName, address);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Falha ao revogar role',
        details: result
      });
    }

    res.json({
      success: true,
      message: `${roleName} revogada de ${address}`,
      data: {
        roleName: result.roleName,
        roleHash: result.roleHash,
        address: result.address,
        txHash: result.txHash,
        blockNumber: result.blockNumber
      }
    });

  } catch (error: any) {
    console.error('Erro ao revogar role:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao revogar role',
      details: error.message
    });
  }
});

/**
 * @route POST /api/admin/grant-institutional-roles
 * @desc Concede todas as 3 roles institucionais para um endereço
 * @body { address: string }
 */
router.post('/grant-institutional-roles', async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Campo obrigatório: address'
      });
    }

    // Validar formato do endereço
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Endereço inválido. Use formato: 0x...'
      });
    }

    const results = await roleManager.grantAllInstitutionalRoles(address);

    const allSuccess = results.every(r => r.success);
    const statusCode = allSuccess ? 200 : 207; // 207 = Multi-Status (sucesso parcial)

    res.status(statusCode).json({
      success: allSuccess,
      message: allSuccess
        ? `Todas as roles institucionais concedidas para ${address}`
        : 'Algumas roles não foram concedidas',
      data: {
        address,
        results: results.map(r => ({
          roleName: r.roleName,
          success: r.success,
          txHash: r.txHash,
          alreadyGranted: r.alreadyGranted,
          error: r.error
        }))
      }
    });

  } catch (error: any) {
    console.error('Erro ao conceder roles institucionais:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao conceder roles institucionais',
      details: error.message
    });
  }
});

/**
 * @route GET /api/admin/roles/:address
 * @desc Consulta todas as roles de um endereço
 */
router.get('/roles/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    // Validar formato do endereço
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Endereço inválido. Use formato: 0x...'
      });
    }

    const roles = await roleManager.getRolesForAddress(address);

    // Filtrar apenas roles que o endereço possui
    const activeRoles = roles.filter(r => r.hasRole);

    res.json({
      success: true,
      data: {
        address,
        activeRoles: activeRoles.map(r => ({
          roleName: r.roleName,
          roleHash: r.roleHash
        })),
        allRoles: roles.map(r => ({
          roleName: r.roleName,
          roleHash: r.roleHash,
          hasRole: r.hasRole
        }))
      }
    });

  } catch (error: any) {
    console.error('Erro ao consultar roles:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao consultar roles',
      details: error.message
    });
  }
});

/**
 * @route GET /api/admin/roles/:roleName/addresses
 * @desc Lista todos os endereços que possuem uma role específica
 */
router.get('/roles/:roleName/addresses', async (req: Request, res: Response) => {
  try {
    const { roleName } = req.params;

    // Validar role name
    const validRoles = Object.values(SystemRole);
    if (!validRoles.includes(roleName as SystemRole)) {
      return res.status(400).json({
        success: false,
        error: `Role inválida. Roles disponíveis: ${validRoles.join(', ')}`
      });
    }

    const addresses = await roleManager.getAddressesWithRole(roleName);

    res.json({
      success: true,
      data: {
        roleName,
        roleHash: roleManager.getRoleHash(roleName),
        addresses,
        count: addresses.length
      }
    });

  } catch (error: any) {
    console.error('Erro ao listar endereços com role:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar endereços',
      details: error.message
    });
  }
});

/**
 * @route POST /api/admin/check-role
 * @desc Verifica se um endereço possui uma role específica
 * @body { roleName: string, address: string }
 */
router.post('/check-role', async (req: Request, res: Response) => {
  try {
    const { roleName, address } = req.body;

    if (!roleName || !address) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: roleName, address'
      });
    }

    // Validar formato do endereço
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Endereço inválido. Use formato: 0x...'
      });
    }

    // Validar role name
    const validRoles = Object.values(SystemRole);
    if (!validRoles.includes(roleName as SystemRole)) {
      return res.status(400).json({
        success: false,
        error: `Role inválida. Roles disponíveis: ${validRoles.join(', ')}`
      });
    }

    const hasRole = await roleManager.hasRole(roleName, address);

    res.json({
      success: true,
      data: {
        roleName,
        roleHash: roleManager.getRoleHash(roleName),
        address,
        hasRole
      }
    });

  } catch (error: any) {
    console.error('Erro ao verificar role:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar role',
      details: error.message
    });
  }
});

/**
 * @route GET /api/admin/info
 * @desc Retorna informações sobre o sistema de roles e o admin
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    const contractInfo = roleManager.getContractInfo();
    const adminPermissions = await roleManager.verifyAdminPermissions();

    res.json({
      success: true,
      data: {
        contract: contractInfo,
        admin: {
          address: adminPermissions.address,
          isAdmin: adminPermissions.isAdmin,
          activeRoles: adminPermissions.roles.map(r => r.roleName)
        },
        availableRoles: Object.values(SystemRole),
        institutionalRoles: [
          SystemRole.FINANCIAL,
          SystemRole.REGISTRY_OFFICE,
          SystemRole.MUNICIPALITY
        ]
      }
    });

  } catch (error: any) {
    console.error('Erro ao obter informações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter informações',
      details: error.message
    });
  }
});

export default router;
