import { Request, Response, NextFunction, Router } from 'express';
import User from '../schemas/user';
import RefreshToken from '../schemas/refreshToken';
import passport from 'passport';
import jwt from 'jsonwebtoken';

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

        // this.router.get(`${this.path}`, this.checkMyInfo);

        // this.router.delete(`${this.path}/logout`, this.logout);
        // this.router.delete(`${this.path}/deleteUser`, this.deleteUser);

        // this.router.post(`${this.path}/sendCode`, this.sendVerificationSMS);
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

}

export default authController
