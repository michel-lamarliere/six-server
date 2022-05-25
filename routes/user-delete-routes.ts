import { Router } from 'express';

const checkAuth = require('../middleware/check-auth');
const userDeleteControllers = require('../controllers/user-delete-controllers');

const router = Router();

router.delete('/account/confirmation', userDeleteControllers.deleteAccountConfirm);

router.use(checkAuth);

router.patch('/account/send-email', userDeleteControllers.deleteAccountEmail);

module.exports = router;
