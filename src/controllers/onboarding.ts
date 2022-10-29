import { Request, Response, NextFunction, Router } from 'express';
import axios from 'axios';

const riotToken = process.env.riotTokenKey;

class onboardingController {
    public path = '/onboarding';
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/checkNick`, this.checkNick);

        // this.router.patch(`${this.path}`, this.updateOnboarding);
        // this.router.get(`${this.path}`, this.getOnboarding);
    }

    private checkNick = async (request: Request, response: Response, next: NextFunction) => {
        let lolNickname: string = ''
        if (request.query.lolNickname) {
            lolNickname = request.query.lolNickname as string
        }
    
        // const exUser = await User.findOne({ lolNickname })
    
        // if (exUser) {
        //     return res.status(409).send({
        //         success: false,
        //         message: '이미 등록된 계정입니다.',
        //     })
        // }
    
        try {
            const summoner = await axios({
                method: 'GET',
                url: encodeURI(
                    `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/${lolNickname}`
                ),
                headers: {
                    'X-Riot-Token': riotToken,
                },
            })
    
            response.status(200).send({
                lolNickname: summoner.data.name,
                profileUrl: `http://ddragon.leagueoflegends.com/cdn/12.18.1/img/profileicon/${summoner.data.profileIconId}.png`,
                message: '계정이 확인되었습니다.',
            })
        } catch (error) {
            console.log(error)
            response.status(404).send({
                message: '존재하지 않는 계정입니다.',
            })
        }
    }
}

export default onboardingController