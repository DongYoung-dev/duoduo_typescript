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

class userController {
    public path = '/user';
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.patch(`${this.path}/writeReview/:userId`, this.writeReview);

        this.router.get(`${this.path}/userInfo/:userId`, this.userInfo);
        // this.router.get(`${this.path}/recentRecord/:userId`, this.recentRecord);

        // this.router.get(`${this.path}/mypage`, this.mypage);
        // this.router.get(`${this.path}/phoneNumber`, this.getPhoneNumber);
        // this.router.patch(`${this.path}/agreeSMS`, this.agreeSMS);
        // this.router.post(`${this.path}/sendSMS`, this.sendSMS);
        // this.router.patch(`${this.path}/firstLogin`, this.firstLogin);
    }

    private writeReview = async (request: Request, response: Response, next: NextFunction) => {
        const reviewedId = request.params.userId
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


}

export default userController