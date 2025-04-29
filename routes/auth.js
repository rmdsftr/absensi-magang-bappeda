import express from 'express';
import authController from '../controller/auth.js';
import upload from '../middleware/foto.js';

const router = express.Router();

router.post('/regis', upload.single('foto'), authController.regis)
router.post('/login', authController.login);
router.get("/logout/:id", authController.logout);

export default router;