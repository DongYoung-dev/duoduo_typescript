import { Request, Response, NextFunction, Router } from 'express';
import User from '../schemas/user';
import mongoose from 'mongoose';
import moment from 'moment';

class duoController {
    public path = '/duo';
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/customList`, this.customList);
        this.router.get(`${this.path}/newList`, this.newList);
    }
    
    private customList = async (request: Request, response: Response, next: NextFunction) => {
        // let userId = response.locals.userId
        let userId: any = '62f63bd76e6b6341b60cee01'
    
        if (!userId) {
            return response.status(401).json({
                message: '로그인이 필요합니다.',
            })
        } else {
            userId = new mongoose.Types.ObjectId(userId)
        }
    
        try {
            const currentUser: any = await User.findOne({ _id: userId })
            const date = moment().format('YYYY년 M월 D일')
            let customList = []
    
            if (currentUser.customDate == date) {
                // 12시 지나기 전
                for (let i = 0; i < currentUser.todaysCustom.length; i++) {
                    const thisUser = await User.findOne({
                        _id: currentUser.todaysCustom[i],
                    }).select({
                        social: 0,
                        socialId: 0,
                        nickname: 0,
                        voiceChannel: 0,
                        banId: 0,
                        todaysCustom: 0,
                        createdAt: 0,
                        updatedAt: 0,
                        __v: 0,
                        communication: 0,
                        customDate: 0,
                    })
    
                    customList.push(thisUser)
    
                    if (!thisUser) {
                        // 추천 소환사 리스트 3명 중 누군가 회원탈퇴 했을 때 리스트를 새로 리프레시
                        customList = []
    
                        const allCustomUser = await User.aggregate([
                            { $match: { _id: { $ne: userId } } },
                            { $unwind: '$playStyle' },
                            {
                                $match: {
                                    playStyle: { $in: currentUser.playStyle },
                                },
                            },
                            {
                                $group: {
                                    _id: '$_id',
                                    count: { $sum: 1 },
                                },
                            },
                        ])
    
                        // count 높은순으로 sort 하면서 3개 slice
                        const sortingField = 'count'
                        const customUser = allCustomUser
                            .sort(function (a: any, b: any) {
                                return b[sortingField] - a[sortingField]
                            })
                            .slice(0, 3)
    
                        let customIdList = []
    
                        // customIdList에 해당 _id값 담으면서 customList에 해당 유저 push
                        for (let i = 0; i < customUser.length; i++) {
                            const customId = customUser[i]._id.toString()
                            customIdList.push(customId)
                            const thisUser = await User.findOne({
                                _id: customId,
                            }).select({
                                social: 0,
                                socialId: 0,
                                nickname: 0,
                                voiceChannel: 0,
                                banId: 0,
                                todaysCustom: 0,
                                createdAt: 0,
                                updatedAt: 0,
                                __v: 0,
                                communication: 0,
                                customDate: 0,
                            })
                            customList.push(thisUser)
                        }
    
                        await User.updateOne(
                            { _id: userId },
                            {
                                $set: {
                                    todaysCustom: customIdList,
                                    customDate: date,
                                },
                            }
                        )
    
                        return response.json({
                            customList,
                        })
                    }
                }
            } else {
                // 12시 지나고 후 && 처음 customList 검색 시
                // playStyle 일치하는 순으로 _id값과 count만 배열
                const allCustomUser = await User.aggregate([
                    { $match: { _id: { $ne: userId } } },
                    { $unwind: '$playStyle' },
                    { $match: { playStyle: { $in: currentUser.playStyle } } },
                    {
                        $group: {
                            _id: '$_id',
                            count: { $sum: 1 },
                        },
                    },
                ])
    
                // count 높은순으로 sort 하면서 3개 slice
                const sortingField = 'count'
                const customUser = allCustomUser
                    .sort(function (a, b) {
                        return b[sortingField] - a[sortingField]
                    })
                    .slice(0, 3)
    
                let customIdList = []
    
                // customIdList에 해당 _id값 담으면서 customList에 해당 유저 push
                for (let i = 0; i < customUser.length; i++) {
                    const customId = customUser[i]._id.toString()
                    customIdList.push(customId)
                    const thisUser = await User.findOne({
                        _id: customId,
                    }).select({
                        social: 0,
                        socialId: 0,
                        nickname: 0,
                        voiceChannel: 0,
                        banId: 0,
                        todaysCustom: 0,
                        createdAt: 0,
                        updatedAt: 0,
                        __v: 0,
                        communication: 0,
                        customDate: 0,
                    })
                    customList.push(thisUser)
                }
    
                await User.updateOne(
                    { _id: userId },
                    {
                        $set: { todaysCustom: customIdList, customDate: date },
                    }
                )
            }
    
            response.json({
                customList,
            })
        } catch (error) {
            console.log(error)
            response.json({
                message: '맞춤소환사 리스트 불러오기에 실패하였습니다.',
            })
        }
    }

    private newList = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const tierList = request.query.tier
            const page: any = request.query.page
            const size = 10
            let userList
    
            if (tierList) {
                userList = await User.find({ tier: { $in: tierList } }).select({
                    social: 0,
                    socialId: 0,
                    nickname: 0,
                    voiceChannel: 0,
                    banId: 0,
                    todaysCustom: 0,
                    updatedAt: 0,
                    __v: 0,
                    communication: 0,
                    customDate: 0,
                })
            } else {
                userList = await User.find({ lolNickname: { $ne: null } }).select({
                    social: 0,
                    socialId: 0,
                    nickname: 0,
                    voiceChannel: 0,
                    banId: 0,
                    todaysCustom: 0,
                    updatedAt: 0,
                    __v: 0,
                    communication: 0,
                    customDate: 0,
                })
            }
    
            const sortingField = 'createdAt'
            let newList
    
            if (page == 0) {
                newList = userList
                    .sort(function (a: any, b: any) {
                        return b[sortingField] - a[sortingField]
                    })
                    .slice(0, 3)
            } else {
                newList = userList
                    .sort(function (a: any, b: any) {
                        return b[sortingField] - a[sortingField]
                    })
                    .slice((page - 1) * size, size * page)
            }
    
            response.json({
                newList,
            })
        } catch (error) {
            console.log(error)
            response.json({
                message: 'new소환사 리스트 불러오기에 실패하였습니다.',
            })
        }
    }

}

export default duoController