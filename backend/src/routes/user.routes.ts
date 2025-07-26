import { Router } from 'express';
import { validate } from '../middleware/validate';
import { userController } from '../controllers/user.controller';
import { userValidation } from '../validations/user.validation';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', validate(userValidation.updateProfile), userController.updateProfile);
router.delete('/profile', userController.deleteAccount);

// Admin only routes
router.get('/', authorize(['admin']), userController.getAllUsers);
router.get('/:id', authorize(['admin']), validate(userValidation.getUserById), userController.getUserById);
router.put('/:id', authorize(['admin']), validate(userValidation.updateUser), userController.updateUser);
router.delete('/:id', authorize(['admin']), validate(userValidation.deleteUser), userController.deleteUser);

export default router;