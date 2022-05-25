import { Router } from 'express';

const checkAuth = require('../middleware/check-auth');
const userControllers = require('../controllers/user-controllers');

const router = Router();

router.post('/sign-up', userControllers.signUp);

router.post('/sign-in', userControllers.signIn);

router.use(checkAuth);

router.get('/refresh-data/:userId', userControllers.refreshData);

module.exports = router;
