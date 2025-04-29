import express from 'express';
import absenController from '../controller/absen.js';

const router = express.Router();

router.post('/add', absenController.add);
router.get('/delete/:id/:tanggal', absenController.del_ete);
router.get('/del/:id/:tanggal', absenController.del);
router.get('/hapus/:id/:today', absenController.hapus);
router.post('/edit/:id/:tanggal', absenController.edit);
router.post('/editAbsen/:id', absenController.editAbsen);
router.get('/rekap/:id', absenController.rekap);

export default router;