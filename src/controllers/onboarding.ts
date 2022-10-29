import { Request, Response, NextFunction, Router } from 'express';
import User from '../schemas/user';
import axios from 'axios';

const riotToken = process.env.riotTokenKey;

interface IData {
    profileUrl: string,
    lolNickname: string,
    position: string[],
    useVoice: boolean,
    voiceChannel: string[],
    communication: string,
    playStyle: string[],
    isOnBoarded: true,
    tier: string,
    rank: string,
    leaguePoints: string
}

class onboardingController {
    public path = '/onboarding';
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/checkNick`, this.checkNick);

        this.router.patch(`${this.path}`, this.updateOnboarding);
        this.router.get(`${this.path}`, this.getOnboarding);
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

    private updateOnboarding = async (request: Request, response: Response, next: NextFunction) => {
        const userId = response.locals.userId
        const lolNickname = request.body.lolNickname
    
        if (!userId) {
            return response.status(401).json({
                message: '로그인이 필요합니다.',
            })
        }
    
        const data: IData = {
            profileUrl: request.body.profileUrl,
            lolNickname: request.body.lolNickname,
            position: request.body.position,
            useVoice: request.body.useVoice,
            voiceChannel: request.body.voiceChannel,
            communication: request.body.communication,
            playStyle: request.body.playStyle,
            isOnBoarded: true,
            tier: '',
            rank: '',
            leaguePoints: ''
        }
    
        try {
            // if (request.file) {
            //     const currentUser = await User.findOne({ _id: userId })
    
            //     if (currentUser.profileUrl) {
            //         if (
            //             currentUser.profileUrl.split('/')[2] !==
            //             'ddragon.leagueoflegends.com'
            //         )
            //             multer.deleteImage(currentUser.profileUrl)
            //     }
            //     data.profileUrl = request.file.location
            // }
    
            const summoner = await axios({
                method: 'GET',
                url: encodeURI(
                    `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/${lolNickname}`
                ),
                headers: {
                    'X-Riot-Token': riotToken,
                },
            })
    
            const leaguePoint = await axios({
                method: 'GET',
                url: encodeURI(
                    `https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.data.id}`
                ),
                headers: {
                    'X-Riot-Token': riotToken,
                },
            })
    
            const soloPoint = leaguePoint.data.find(
                (x: any) => x.queueType == 'RANKED_SOLO_5x5'
            )
    
            if (soloPoint) {
                const tier = soloPoint.tier
                const rank = soloPoint.rank
                const leaguePoints = soloPoint.leaguePoints
    
                data.tier = tier
                data.rank = rank
                data.leaguePoints = leaguePoints
            } else {
                const tier = 'UNRANKED'
                const rank = ''
                const leaguePoints = ''
    
                data.tier = tier
                data.rank = rank
                data.leaguePoints = leaguePoints
            }
    
            await User.updateOne({ _id: userId }, { $set: data })
            response.status(200).json({
                message: '추가정보 등록에 성공하였습니다.',
            })
        } catch (error) {
            console.log(error)
            response.json({
                message: '추가정보 등록에 실패하였습니다.',
            })
        }
    }

    private getOnboarding = async (request: Request, response: Response, next: NextFunction) => {
        const userId = response.locals.userId
    
        if (!userId) {
            return response.status(401).json({
                message: '로그인이 필요합니다.',
            })
        }
    
        try {
            const currentUser: any = await User.findOne({ _id: userId })
    
            response.status(200).json({
                success: true,
                profileUrl: currentUser.profileUrl,
                lolNickname: currentUser.lolNickname,
                position: currentUser.position,
                useVoice: currentUser.useVoice,
                voiceChannel: currentUser.voiceChannel,
                communication: currentUser.communication,
                playStyle: currentUser.playStyle,
            })
        } catch (error) {
            console.log(error)
            response.json({
                message: '온보딩 불러오기에 실패하였습니다.',
            })
        }
    }

}

export default onboardingController