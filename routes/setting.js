import express from 'express';
import settingController from '../controller/setting.js';
import upload from '../middleware/foto.js';

const router = express.Router();

router.post('/jam', settingController.jam);
router.post('/libur',settingController.libur );
router.post('/libur/edit/:tanggal',settingController.editLibur);
router.get('/delete/:tanggal', settingController.del_ete);
router.get('/edit/:tanggal', settingController.edit);
router.get('/akun/:id', settingController.akun);
router.post('/ubah/:id', upload.single('foto'), settingController.ubah);
router.post('/set-ip', settingController.ip);

export default router;