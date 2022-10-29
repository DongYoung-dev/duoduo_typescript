import { Request, Response, NextFunction, Router } from 'express';
import User from '../schemas/user';
import Review from '../schemas/review';
import Improvement from '../schemas/improvement';
import axios from 'axios';
import fs from 'fs';
const chapmions = fs.readFileSync('src/datas/champions.json', 'utf8')
const perks = fs.readFileSync('src/datas/perks.json', 'utf8')
const queueTypes = fs.readFileSync('src/datas/queueTypes.json', 'utf8')
const spells = fs.readFileSync('src/datas/spells.json', 'utf8')

const riotToken = process.env.riotTokenKey;

interface match {
    gameMode: string,
    gameType: string,
    queueType: string,
    gameStartTimestamp: number,
    gameEndTimestamp: number,
    win: boolean,
    championName: string,
    championNameKR: string,
    perk1: string,
    perk2: string,
    spell1: string,
    spell2: string,
    item0: number,
    item1: number,
    item2: number,
    item3: number,
    item4: number,
    item5: number,
    item6: number,
    champLevel: number,
    totalMinionsKilled: number,
    kills: number,
    deaths: number,
    assists: number,
    kda: number,
}

class userController {
    public path = '/user';
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.patch(`${this.path}/writeReview/:userId`, this.writeReview);

        this.router.get(`${this.path}/userInfo/:userId`, this.userInfo);
        this.router.get(`${this.path}/recentRecord/:userId`, this.recentRecord);

        this.router.get(`${this.path}/mypage`, this.mypage);
        // this.router.get(`${this.path}/phoneNumber`, this.getPhoneNumber);
        // this.router.patch(`${this.path}/agreeSMS`, this.agreeSMS);
        // this.router.post(`${this.path}/sendSMS`, this.sendSMS);
        // this.router.patch(`${this.path}/firstLogin`, this.firstLogin);
    }

    private writeReview = async (request: Request, response: Response, next: NextFunction) => {
        const reviewedId = request.params.userId
        // const reviewerId = response.locals.userId
        const reviewerId = '62f63bd76e6b6341b60cee01'

        if (!reviewerId) {
            return response.status(401).json({
                message: '로그인이 필요합니다.',
            })
        }

        const goodReview = request.body.goodReview
        const badReview = request.body.badReview
        const improvement = request.body.additionalBadReview

        try {
            const reviewedCheck = await Review.findOne({ reviewedId })
            if (reviewedCheck) {
                await Review.updateOne({ reviewedId }, { $push: { reviewerId } })
                for (let i = 0; i < goodReview.length; i++) {
                    const descriptionCheck = await Review.findOne({
                        reviewedId,
                        'goodReview.description': goodReview[i].description,
                    })
                    if (descriptionCheck) {
                        await Review.updateOne(
                            {
                                reviewedId,
                                'goodReview.description': goodReview[i].description,
                            },
                            { $inc: { 'goodReview.$.count': 1 } }
                        )
                    } else {
                        await Review.updateOne(
                            { reviewedId },
                            {
                                $push: {
                                    goodReview: {
                                        description: goodReview[i].description,
                                        count: 1,
                                    },
                                },
                            }
                        )
                    }
                }
                for (let i = 0; i < badReview.length; i++) {
                    const descriptionCheck = await Review.findOne({
                        reviewedId,
                        'badReview.description': badReview[i].description,
                    })
                    if (descriptionCheck) {
                        await Review.updateOne(
                            {
                                reviewedId,
                                'badReview.description': badReview[i].description,
                            },
                            { $inc: { 'badReview.$.count': 1 } }
                        )
                    } else {
                        await Review.updateOne(
                            { reviewedId },
                            {
                                $push: {
                                    badReview: {
                                        description: badReview[i].description,
                                        count: 1,
                                    },
                                },
                            }
                        )
                    }
                }
            } else {
                await Review.create({ reviewedId, reviewerId })
                for (let i = 0; i < goodReview.length; i++) {
                    await Review.updateOne(
                        { reviewedId },
                        {
                            $push: {
                                goodReview: {
                                    description: goodReview[i].description,
                                    count: 1,
                                },
                            },
                        }
                    )
                }
                for (let i = 0; i < badReview.length; i++) {
                    await Review.updateOne(
                        { reviewedId },
                        {
                            $push: {
                                badReview: {
                                    description: badReview[i].description,
                                    count: 1,
                                },
                            },
                        }
                    )
                }
            }

            if (improvement) {
                await Improvement.create({ context: improvement })
            }

            response.status(200).send({
                message: '리뷰작성에 성공하였습니다.',
            })
        } catch (error) {
            console.log(error)
            response.send({
                message: '리뷰작성에 실패하였습니다.',
            })
        }
    }

    private userInfo = async (request: Request, response: Response, next: NextFunction) => {
        const userId = request.params.userId
        let goodReview: any[] = []

        try {
            const currentUser: any = await User.findOne({ _id: userId })
            const lolNickname = currentUser.lolNickname

            const summoner = await axios({
                method: 'GET',
                url: encodeURI(
                    `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/${lolNickname}`
                ),
                headers: {
                    'X-Riot-Token': riotToken,
                },
            })

            const mostChampionList = await axios({
                method: 'GET',
                url: encodeURI(
                    `https://kr.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summoner.data.id}`
                ),
                headers: {
                    'X-Riot-Token': riotToken,
                },
            })

            let mostChampion = []

            if (mostChampionList.data.length !== 0) {
                const mostChampion1 = JSON.parse(chapmions).find(
                    (x: any) => x.key == mostChampionList.data[0].championId
                ).id
                const mostChampion2 = JSON.parse(chapmions).find(
                    (x: any) => x.key == mostChampionList.data[1].championId
                ).id
                const mostChampion3 = JSON.parse(chapmions).find(
                    (x: any) => x.key == mostChampionList.data[2].championId
                ).id

                mostChampion.push(mostChampion1, mostChampion2, mostChampion3)
            }

            const review: any = await Review.findOne({ reviewedId: userId })

            if (review) {
                response.status(200).json({
                    lolNickname,
                    profileUrl: currentUser.profileUrl,
                    tier: currentUser.tier,
                    rank: currentUser.rank,
                    leaguePoints: currentUser.leaguePoints,
                    playStyle: currentUser.playStyle,
                    position: currentUser.position,
                    useVoice: currentUser.useVoice,
                    voiceChannel: currentUser.voiceChannel,
                    communication: currentUser.communication,
                    mostChampion,
                    goodReview: review.goodReview,
                })
            } else {
                response.status(200).json({
                    lolNickname,
                    profileUrl: currentUser.profileUrl,
                    tier: currentUser.tier,
                    rank: currentUser.rank,
                    leaguePoints: currentUser.leaguePoints,
                    playStyle: currentUser.playStyle,
                    position: currentUser.position,
                    useVoice: currentUser.useVoice,
                    voiceChannel: currentUser.voiceChannel,
                    communication: currentUser.communication,
                    mostChampion,
                    goodReview,
                })
            }
        } catch (error) {
            console.log(error)
            response.json({
                message: '유저정보 불러오기에 실패하였습니다.',
            })
        }
    }

    private recentRecord = async (request: Request, response: Response, next: NextFunction) => {
        const userId = request.params.userId
        const page: any = request.query.page
        const size = 5

        try {
            const currentUser: any = await User.findOne({ _id: userId })
            const lolNickname = currentUser.lolNickname

            const summoner = await axios({
                method: 'GET',
                url: encodeURI(
                    `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/${lolNickname}`
                ),
                headers: {
                    'X-Riot-Token': riotToken,
                },
            })

            const matchList = await axios({
                method: 'GET',
                url: encodeURI(
                    `https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${summoner.data.puuid}/ids?start=0&count=100`
                ),
                headers: {
                    'X-Riot-Token': riotToken,
                },
            })

            let recentRecord = []

            if (matchList.data.length !== 0) {
                for (let i = (page - 1) * size; i < size * page; i++) {
                    let data: match = {
                        gameMode: '',
                        gameType: '',
                        queueType: '',
                        gameStartTimestamp: 0,
                        gameEndTimestamp: 0,
                        win: true,
                        championName: '',
                        championNameKR: '',
                        perk1: '',
                        perk2: '',
                        spell1: '',
                        spell2: '',
                        item0: 0,
                        item1: 0,
                        item2: 0,
                        item3: 0,
                        item4: 0,
                        item5: 0,
                        item6: 0,
                        champLevel: 0,
                        totalMinionsKilled: 0,
                        kills: 0,
                        deaths: 0,
                        assists: 0,
                        kda: 0,
                    }

                    const match = await axios({
                        method: 'GET',
                        url: encodeURI(
                            `https://asia.api.riotgames.com/lol/match/v5/matches/${matchList.data[i]}`
                        ),
                        headers: {
                            'X-Riot-Token': riotToken,
                        },
                    })

                    const myData = match.data.info.participants.filter(
                        (x: any) => x.puuid == summoner.data.puuid
                    )

                    data.gameMode = match.data.info.gameMode
                    data.gameType = match.data.info.gameType
                    data.queueType = JSON.parse(queueTypes).find(
                        (x: any) => x.queueId === match.data.info.queueId
                    ).description
                    data.gameStartTimestamp = match.data.info.gameStartTimestamp
                    data.gameEndTimestamp = match.data.info.gameEndTimestamp
                    data.win = myData[0].win
                    const champion = JSON.parse(chapmions).find(
                        (x: any) => x.key == myData[0].championId
                    )
                    data.championName = champion.id
                    data.championNameKR = champion.name
                    const primaryStyle = JSON.parse(perks).find(
                        (x: any) => x.id === myData[0].perks.styles[0].style
                    )
                    data.perk1 = primaryStyle.slots[0].runes.find(
                        (x: any) => x.id === myData[0].perks.styles[0].selections[0].perk
                    ).icon
                    data.perk2 = JSON.parse(perks).find(
                        (x: any) => x.id === myData[0].perks.styles[1].style
                    ).icon
                    data.spell1 = JSON.parse(spells).find(
                        (x: any) => x.key == myData[0].summoner1Id
                    ).id
                    data.spell2 = JSON.parse(spells).find(
                        (x: any) => x.key == myData[0].summoner2Id
                    ).id
                    data.item0 = myData[0].item0
                    data.item1 = myData[0].item1
                    data.item2 = myData[0].item2
                    data.item3 = myData[0].item3
                    data.item4 = myData[0].item4
                    data.item5 = myData[0].item5
                    data.item6 = myData[0].item6
                    data.champLevel = myData[0].champLevel
                    data.totalMinionsKilled =
                        myData[0].totalMinionsKilled +
                        myData[0].neutralMinionsKilled
                    data.kills = myData[0].kills
                    data.deaths = myData[0].deaths
                    data.assists = myData[0].assists
                    if (myData[0].deaths == 0) {
                        if (myData[0].kills + myData[0].assists == 0) {
                            data.kda = 0
                        } else {
                            data.kda = -1 // Infinity
                        }
                    } else {
                        data.kda =
                            (myData[0].kills + myData[0].assists) / myData[0].deaths
                    }

                    recentRecord.push(data)
                }
            }

            response.status(200).json({
                recentRecord,
            })
        } catch (error) {
            console.log(error)
            response.json({
                message: '최근전적 불러오기에 실패하였습니다.',
            })
        }
    }
    
    private mypage = async (request: Request, response: Response, next: NextFunction) => {
        // const userId = response.locals.userId
        const userId = '62f63bd76e6b6341b60cee01'
    
        if (!userId) {
            return response.status(401).json({
                message: '로그인이 필요합니다.',
            })
        }
    
        let goodReview: any[] = []
        let badReview: any[] = []
        let registerPhone: boolean
    
        try {
            const currentUser: any = await User.findOne({ _id: userId })
            const review: any = await Review.findOne({ reviewedId: userId })
            if (currentUser.phoneNumber) {
                registerPhone = true
            } else {
                registerPhone = false
            }
    
            if (review) {
                response.status(200).json({
                    lolNickname: currentUser.lolNickname,
                    profileUrl: currentUser.profileUrl,
                    tier: currentUser.tier,
                    rank: currentUser.rank,
                    leaguePoints: currentUser.leaguePoints,
                    playStyle: currentUser.playStyle,
                    position: currentUser.position,
                    useVoice: currentUser.useVoice,
                    goodReview: review.goodReview,
                    badReview: review.badReview,
                    registerPhone,
                    agreeSMS: currentUser.agreeSMS,
                })
            } else {
                response.status(200).json({
                    lolNickname: currentUser.lolNickname,
                    profileUrl: currentUser.profileUrl,
                    tier: currentUser.tier,
                    rank: currentUser.rank,
                    leaguePoints: currentUser.leaguePoints,
                    playStyle: currentUser.playStyle,
                    position: currentUser.position,
                    useVoice: currentUser.useVoice,
                    goodReview,
                    badReview,
                    registerPhone,
                    agreeSMS: currentUser.agreeSMS,
                })
            }
        } catch (error) {
            console.log(error)
            response.json({
                message: '내정보 불러오기에 실패하였습니다.',
            })
        }
    }

    
}

export default userController