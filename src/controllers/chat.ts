import { Request, Response, NextFunction, Router } from 'express';

class chatController {
    public path = '/chat';
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

export default chatController