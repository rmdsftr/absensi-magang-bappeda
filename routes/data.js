import express from 'express';
import dataController from '../controller/data.js';
import upload from '../middleware/foto.js';

const router = express.Router();

router.post('/input',upload.single('foto'), dataController.input);
router.get('/:id', dataController.profil);
router.get('/:id/:tanggal', dataController.editAbsen);
router.post('/edit', dataController.edit);
router.get('/magang/delete/:id', dataController.hapus);

export default router;