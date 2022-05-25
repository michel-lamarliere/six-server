import { Router } from 'express';

const checkAuth = require('../middleware/check-auth');
const userModifyControllers = require('../controllers/user-modify-controllers');

const router = Router();

router.patch('/email-confirmation/confirm', userModifyControllers.confirmEmailAddress);

router.get(
	'/password/forgot/send-email/:email',
	userModifyControllers.sendEmailForgotPassword
);

router.get(
	'/password/forgot/confirmation/:email/:uniqueId',
	userModifyControllers.checkForgotPasswordAuth
);

router.patch('/password/forgot', userModifyControllers.changeForgottenPassword);

router.patch('/email/confirmation', userModifyControllers.changeEmailConfirmation);

router.patch('/password', userModifyControllers.changePassword);

router.use(checkAuth);

router.post(
	'/email-confirmation/send-email',
	userModifyControllers.resendEmailConfirmation
);

router.patch('/name', userModifyControllers.changeName);

router.patch('/image', userModifyControllers.changeImage);

router.patch('/email', userModifyControllers.changeEmail);

module.exports = router;
