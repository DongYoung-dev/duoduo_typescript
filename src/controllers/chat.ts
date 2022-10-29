import { Request, Response, NextFunction, Router } from 'express';
import User from '../schemas/user';
import Chat from '../schemas/chat';
import Chatroom from '../schemas/chatroom';

class chatController {
    public path = '/chat';
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/roomId/:userId`, this.getRoomId);
        this.router.get(`${this.path}/opponent/:roomId`, this.getOpponent);
        this.router.get(`${this.path}/message/:roomId`, this.getChat);
    }
    
    private getRoomId = async (request: Request, response: Response, next: NextFunction) => {
        // const myId = response.locals.userId
        const myId = '62f63bd76e6b6341b60cee01'
        const userId = request.params.userId
        const array = [myId, userId].sort()
    
        try {
            const exChatroom = await Chatroom.findOne({ userId: array })
    
            let roomId = ''
            if (exChatroom) {
                roomId = exChatroom._id
            } else {
                const room = await Chatroom.create({ userId: array })
                roomId = room._id
            }
    
            response.status(200).json({
                roomId,
            })
        } catch (error) {
            response.json({
                message: '채팅방 아이디 불러오기에 실패하였습니다.',
            })
        }
    }
    
    private getOpponent = async (request: Request, response: Response, next: NextFunction) => {
        // const userId = response.locals.userId
        const userId = '62f63bd76e6b6341b60cee01'
        const roomId = request.params.roomId
    
        try {
            const room: any = await Chatroom.findOne({ _id: roomId })
            const opponentId = room.userId.find((x: any) => x != userId)
            const opponentUser: any = await User.findOne({ _id: opponentId })
    
            let opponent: any = {}
            opponent.userId = opponentUser._id
            opponent.profileUrl = opponentUser.profileUrl
            opponent.lolNickname = opponentUser.lolNickname
    
            response.status(200).json({
                opponent,
            })
        } catch (error) {
            console.log(error)
            response.json({
                message: '상대 정보 불러오기에 실패하였습니다.',
            })
        }
    }
    
    private getChat = async (request: Request, response: Response, next: NextFunction) => {
        const roomId = request.params.roomId
    
        try {
            const chat = await Chat.aggregate([
                { $match: { roomId } },
                {
                    $sort: {
                        date: 1,
                    },
                },
                {
                    $group: {
                        _id: '$date',
                        obj: {
                            $push: {
                                text: '$text',
                                userId: '$userId',
                                createdAt: '$createdAt',
                                isRead: '$isRead',
                            },
                        },
                    },
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $let: {
                                vars: {
                                    obj: [
                                        {
                                            k: { $substr: ['$_id', 0, -1] },
                                            v: '$obj',
                                        },
                                    ],
                                },
                                in: { $arrayToObject: '$$obj' },
                            },
                        },
                    },
                },
            ])
    
            response.status(200).json({
                chat,
            })
        } catch (error) {
            console.log(error)
            response.json({
                message: '채팅 내역 불러오기에 실패하였습니다.',
            })
        }
    }

}

export default chatController