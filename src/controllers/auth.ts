import { Request, Response, NextFunction, Router } from 'express';
import User from '../schemas/user';
import RefreshToken from '../schemas/refreshToken';
import Improvement from '../schemas/improvement';
import Chatroom from '../schemas/chatroom';
import Certification from '../schemas/certification';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import crypto from 'crypto-js'

const tokenExpireTime = process.env.VALID_ACCESS_TOKEN_TIME
const rtokenExpireTime = process.env.VALID_REFRESH_TOKEN_TIME

const COOKIE_OPTIONS = {
    domain: '.duoduo.lol',
    secure: true,
    httpOnly: true,
    // sameSite: 'none',
}

class authController {
    public path = '/auth';
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // this.router.get(`${this.path}/kakao`, this.);
        this.router.get(`${this.path}/kakao/callback`, this.kakaoCallback);

        // this.router.get(`${this.path}/naver`, this.);
        this.router.get(`${this.path}/naver/callback`, this.naverCallback);

        // this.router.get(`${this.path}/discord`, this.);
        this.router.get(`${this.path}/discord/callback`, this.discordCallback);

        this.router.get(`${this.path}`, this.checkMyInfo);

        this.router.delete(`${this.path}/logout`, this.logout);
        this.router.delete(`${this.path}/deleteUser`, this.deleteUser);

        this.router.post(`${this.path}/sendCode`, this.sendVerificationSMS);
        // this.router.post(`${this.path}/verifyCode`, this.verifyCode);
    }

    private kakaoCallback = async (request: Request, response: Response, next: NextFunction) => {
        passport.authenticate(
            'kakao',
            { failureRedirect: '/' },
            async (err: any, user: any, info: any) => {
                if (err) return next(err)
                const userId = user._id
                const token = jwt.sign({ userId: userId }, process.env.TOKENKEY!, {
                    expiresIn: tokenExpireTime,
                })
                let refreshToken = ''

                const currentUser: any = await User.findOne({ _id: userId })

                const dbRefresh: any = await RefreshToken.findOne({ userId })
                if (dbRefresh) {
                    refreshToken = dbRefresh.refreshToken
                } else {
                    refreshToken = jwt.sign(
                        { userId: userId },
                        process.env.TOKENKEY!,
                        {
                            expiresIn: rtokenExpireTime,
                        }
                    )

                    await RefreshToken.create({ userId, refreshToken })
                }

                response.cookie('token', token, COOKIE_OPTIONS)
                    .cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
                    .status(200)
                    .json({
                        isOnBoarded: currentUser.isOnBoarded,
                        firstLogin: currentUser.firstLogin,
                    })
            }
        )(request, response)
    }

    private naverCallback = async (request: Request, response: Response, next: NextFunction) => {
        passport.authenticate(
            'naver',
            { failureRedirect: '/' },
            async (err: any, user: any, info: any) => {
                if (err) return next(err)
                const userId = user._id
                const token = jwt.sign({ userId: userId }, process.env.TOKENKEY!, {
                    expiresIn: tokenExpireTime,
                })
                let refreshToken = ''

                const currentUser: any = await User.findOne({ _id: userId })

                const dbRefresh: any = await RefreshToken.findOne({ userId })
                if (dbRefresh) {
                    refreshToken = dbRefresh.refreshToken
                } else {
                    refreshToken = jwt.sign(
                        { userId: userId },
                        process.env.TOKENKEY!,
                        {
                            expiresIn: rtokenExpireTime,
                        }
                    )

                    await RefreshToken.create({ userId, refreshToken })
                }

                response.cookie('token', token, COOKIE_OPTIONS)
                    .cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
                    .status(200)
                    .json({
                        isOnBoarded: currentUser.isOnBoarded,
                        firstLogin: currentUser.firstLogin,
                    })
            }
        )(request, response)
    }

    private discordCallback = async (request: Request, response: Response, next: NextFunction) => {
        passport.authenticate(
            'discord',
            { failureRedirect: '/' },
            async (err: any, user: any, info: any) => {
                if (err) return next(err)
                const userId = user._id
                const token = jwt.sign({ userId: userId }, process.env.TOKENKEY!, {
                    expiresIn: tokenExpireTime,
                })
                let refreshToken = ''

                const currentUser: any = await User.findOne({ _id: userId })

                const dbRefresh: any = await RefreshToken.findOne({ userId })
                if (dbRefresh) {
                    refreshToken = dbRefresh.refreshToken
                } else {
                    refreshToken = jwt.sign(
                        { userId: userId },
                        process.env.TOKENKEY!,
                        {
                            expiresIn: rtokenExpireTime,
                        }
                    )

                    await RefreshToken.create({ userId, refreshToken })
                }

                response.cookie('token', token, COOKIE_OPTIONS)
                    .cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
                    .status(200)
                    .json({
                        isOnBoarded: currentUser.isOnBoarded,
                        firstLogin: currentUser.firstLogin,
                    })
            }
        )(request, response)
    }

    private checkMyInfo = async (request: Request, response: Response, next: NextFunction) => {
        const userId = response.locals.userId
        const lolNickname = response.locals.lolNickname
        const profileUrl = response.locals.profileUrl
        const isOnBoarded = response.locals.isOnBoarded
        const playStyle = response.locals.playStyle
        const firstLogin = response.locals.firstLogin
    
        response.status(200).json({
            userId,
            lolNickname,
            profileUrl,
            isOnBoarded,
            playStyle,
            firstLogin,
        })
    }

    private logout = async (request: Request, response: Response, next: NextFunction) => {
        const userId = response.locals.userId
    
        response.clearCookie('token', COOKIE_OPTIONS)
            .clearCookie('refreshToken', COOKIE_OPTIONS)
            .status(200)
            .json({
                message: '로그아웃 되었습니다.',
            })
    }

    private deleteUser = async (request: Request, response: Response, next: NextFunction) => {
        const userId = response.locals.userId
        const improvement = request.body.reason
    
        try {
            if (userId) {
                if (improvement) {
                    await Improvement.create({ context: improvement })
                }
    
                await User.deleteOne({ _id: userId })
                await RefreshToken.deleteOne({ userId })
                await Chatroom.deleteMany({ userId: { $in: userId } })
                response.clearCookie('token', COOKIE_OPTIONS)
                    .clearCookie('refreshToken', COOKIE_OPTIONS)
                    .status(200)
                    .json({
                        message: '회원탈퇴에 성공하였습니다.',
                    })
            } else {
                response.json({
                    message: '즐',
                })
            }
        } catch (error) {
            console.log(error)
            response.json({
                message: '회원탈퇴에 실패하였습니다.',
            })
        }
    }

    private sendVerificationSMS = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const userId = response.locals.userId
    
            const phoneNumber = request.body.phoneNumber
    
            // const user_phone_number = phoneNumber.split('-').join('') // SMS를 수신할 전화번호
            const verificationCode =
                Math.floor(Math.random() * (999999 - 100000)) + 100000 // 인증 코드 (6자리 숫자)
            const date = Date.now().toString() // 날짜 string
    
            // 환경 변수
            const sens_service_id = process.env.NCP_SENS_ID
            const sens_access_key = process.env.NCP_SENS_ACCESS
            const sens_secret_key = process.env.NCP_SENS_SECRET
            const sens_call_number = process.env.CALLER_NUMBER
    
            // url 관련 변수 선언
            const method = 'POST'
            const space = ' '
            const newLine = '\n'
            const url = `https://sens.apigw.ntruss.com/sms/v2/services/${sens_service_id}/messages`
            const url2 = `/sms/v2/services/${sens_service_id}/messages`
    
            // signature 작성 : crypto-js 모듈을 이용하여 암호화
            const hmac = CryptoJS.algo.HMAC.create(
                CryptoJS.algo.SHA256,
                sens_secret_key!
            )
            hmac.update(method)
            hmac.update(space)
            hmac.update(url2)
            hmac.update(newLine)
            hmac.update(date)
            hmac.update(newLine)
            hmac.update(sens_access_key!)
            const hash = hmac.finalize()
            const signature = hash.toString(CryptoJS.enc.Base64)
    
            // sens 서버로 요청 전송
            const smsRes = await axios({
                method: method,
                url: url,
                headers: {
                    'Contenc-type': 'application/json; charset=utf-8',
                    'x-ncp-iam-access-key': sens_access_key,
                    'x-ncp-apigw-timestamp': date,
                    'x-ncp-apigw-signature-v2': signature,
                },
                data: {
                    type: 'SMS',
                    countryCode: '82',
                    from: sens_call_number,
                    content: `듀오해듀오 인증번호는 [${verificationCode}] 입니다.`,
                    messages: [{ to: `${phoneNumber}` }],
                },
            })
            console.log('response', smsRes.data)
    
            const certification = await Certification.findOne({ userId })
    
            if (certification) {
                await Certification.deleteMany({ userId })
                await Certification.create({ userId, verifyCode: verificationCode })
            } else {
                await Certification.create({ userId, verifyCode: verificationCode })
            }
    
            return response.status(200).json({
                message: '인증번호를 전송하였습니다.',
            })
        } catch (err) {
            console.log(err)
            response.status(400).json({
                message: '인증번호 전송을 실패하였습니다.',
            })
        }
    }

    // private verifyCode = async (request: Request, response: Response, next: NextFunction) => {
    //     const userId = response.locals.userId
    
    //     const { phoneNumber, code } = request.body
    
    //     const dbCode: any = await Certification.findOne({ userId })
    
    //     if (code == dbCode.verifyCode) {
    //         await Certification.deleteMany({ userId })
    
    //         const key = process.env.CRYPTO_KEY
    //         const encrypt = crypto.createCipher('des', key)
    //         const encryptResult =
    //             encrypt.update(phoneNumber, 'utf8', 'base64') +
    //             encrypt.final('base64')
    
    //         await User.updateOne(
    //             { _id: userId },
    //             { $set: { phoneNumber: encryptResult, agreeSMS: true } }
    //         )
    
    //         return response.status(200).json({ message: '핸드폰 인증 완료.' })
    //     } else {
    //         return response.status(400).json({ message: '인증번호가 다릅니다.' })
    //     }
    // }

}

export default authController
