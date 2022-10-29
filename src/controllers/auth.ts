import { Request, Response, NextFunction, Router } from 'express';

class authController {
    public path = '/auth';
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path, this.checkMyInfo);
    }
    
    private checkMyInfo = async (request: Request, response: Response, next: NextFunction) => {
        const a: number = 1
        response.status(200).json(a)
    }
}

export default authController
