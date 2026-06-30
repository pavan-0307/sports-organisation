import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  listSports,
  createSport,
  updateSport,
  deleteSport,
  listBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listInventoryUnits,
  createInventoryUnit,
  bulkGenerateInventoryUnits,
  updateInventoryUnit
} from '../controllers/inventory.controller.js';

const router: Router = Router();

// Sports Routes
router.get('/sports', listSports);
router.post('/sports', authenticateJWT, authorizeRoles('staff', 'admin', 'super_admin'), createSport);
router.put('/sports/:id', authenticateJWT, authorizeRoles('staff', 'admin', 'super_admin'), updateSport);
router.delete('/sports/:id', authenticateJWT, authorizeRoles('admin', 'super_admin'), deleteSport);

// Brands Routes
router.get('/brands', listBrands);
router.post('/brands', authenticateJWT, authorizeRoles('staff', 'admin', 'super_admin'), createBrand);
router.put('/brands/:id', authenticateJWT, authorizeRoles('staff', 'admin', 'super_admin'), updateBrand);
router.delete('/brands/:id', authenticateJWT, authorizeRoles('admin', 'super_admin'), deleteBrand);

// Categories Routes
router.get('/categories', listCategories);
router.post('/categories', authenticateJWT, authorizeRoles('staff', 'admin', 'super_admin'), createCategory);
router.put('/categories/:id', authenticateJWT, authorizeRoles('staff', 'admin', 'super_admin'), updateCategory);
router.delete('/categories/:id', authenticateJWT, authorizeRoles('admin', 'super_admin'), deleteCategory);

// Products Routes
router.get('/products', listProducts);
router.post('/products', authenticateJWT, authorizeRoles('staff', 'admin', 'super_admin'), createProduct);
router.put('/products/:id', authenticateJWT, authorizeRoles('staff', 'admin', 'super_admin'), updateProduct);
router.delete('/products/:id', authenticateJWT, authorizeRoles('admin', 'super_admin'), deleteProduct);

// Inventory Units Routes
router.get('/units', authenticateJWT, authorizeRoles('staff', 'admin', 'super_admin'), listInventoryUnits);
router.post('/units', authenticateJWT, authorizeRoles('staff', 'admin', 'super_admin'), createInventoryUnit);
router.post('/units/bulk-generate', authenticateJWT, authorizeRoles('staff', 'admin', 'super_admin'), bulkGenerateInventoryUnits);
router.put('/units/:id', authenticateJWT, authorizeRoles('staff', 'admin', 'super_admin'), updateInventoryUnit);

export default router;
