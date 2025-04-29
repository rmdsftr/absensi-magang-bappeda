import express from 'express';
import dataController from '../controller/data.js';
import indexController from '../controller/index.js';
import authController from '../controller/auth.js';

const router = express.Router();

router.get('/', indexController.home);
router.get('/magang', dataController.magang);
router.get('/absen/all', indexController.all);
router.get('/setting', indexController.setting);
router.get('/attendance/:id', dataController.attend);
router.post('/konfirmasi', dataController.confirm);
router.get('/index', authController.index);
router.get('/register', indexController.regis);
router.get('/lupa', indexController.lupa);
router.get('/redirect', indexController.redirect);
router.get('/open-in-safari', indexController.safari);


export default router;