require('dotenv').config()
import App from './app';

import authController from './controllers/auth';
import chatController from './controllers/chat';
import duoController from './controllers/duo';
import onboardingController from './controllers/onboarding';
import userController from './controllers/user';

const app = new App(
    [
        new authController(),
        new chatController(),
        new duoController(),
        new onboardingController(),
        new userController(),
    ],
);

app.listen();