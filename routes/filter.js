import express from 'express';
import filterController from '../controller/filter.js';

const router = express.Router();

router.get('/:selectedValue', filterController.filter);

export default router;