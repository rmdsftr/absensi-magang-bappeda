import express from 'express';
import excelControllers from '../controller/excel.js';

const router = express.Router();

router.get('/absen', excelControllers.absen);
router.get('/:id', excelControllers.user);

export default router;