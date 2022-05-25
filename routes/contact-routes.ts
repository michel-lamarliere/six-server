import { Router } from 'express';

const contactControllers = require('../controllers/contact-controllers');

const router = Router();

router.post('/message', contactControllers.sendMessage);

module.exports = router;
