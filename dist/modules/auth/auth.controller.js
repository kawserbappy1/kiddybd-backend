"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const errors_1 = require("../../common/errors");
class AuthController {
    authService = new auth_service_1.AuthService();
    setCookie(res, token) {
        res.cookie('refreshToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }
    sendPhoneOTP = async (req, res, next) => {
        try {
            const result = await this.authService.sendPhoneOTP(req.body.phone);
            res.json({
                success: true,
                message: 'OTP sent to phone',
                data: process.env.NODE_ENV !== 'production' ? { otp: result.otp } : undefined,
            });
        }
        catch (err) {
            next(err);
        }
    };
    verifyPhoneOTP = async (req, res, next) => {
        try {
            const { accessToken, refreshToken, user } = await this.authService.verifyPhoneOTP(req.body.phone, req.body.otp);
            this.setCookie(res, refreshToken);
            res.json({ success: true, data: { accessToken, user } });
        }
        catch (err) {
            next(err);
        }
    };
    loginWithFirebasePhone = async (req, res, next) => {
        try {
            const { accessToken, refreshToken, user } = await this.authService.loginWithFirebasePhone(req.body.phone, req.body.idToken);
            this.setCookie(res, refreshToken);
            res.json({ success: true, data: { accessToken, user } });
        }
        catch (err) {
            next(err);
        }
    };
    sendEmailOTP = async (req, res, next) => {
        try {
            await this.authService.sendEmailOTP(req.body.email);
            res.json({ success: true, message: 'OTP sent to email' });
        }
        catch (err) {
            next(err);
        }
    };
    verifyEmailOTP = async (req, res, next) => {
        try {
            const { accessToken, refreshToken, user } = await this.authService.verifyEmailOTP(req.body.email, req.body.otp);
            this.setCookie(res, refreshToken);
            res.json({ success: true, data: { accessToken, user } });
        }
        catch (err) {
            next(err);
        }
    };
    getMe = async (req, res, next) => {
        try {
            const user = await this.authService.getUserById(req.user.userId);
            res.json({ success: true, data: user });
        }
        catch (err) {
            next(err);
        }
    };
    getGoogleAuthUrl = async (req, res, next) => {
        try {
            const url = await this.authService.getGoogleAuthUrl();
            if (req.headers.accept?.includes('application/json')) {
                res.json({ success: true, data: { url } });
            }
            else {
                res.redirect(url);
            }
        }
        catch (err) {
            next(err);
        }
    };
    handleGoogleCallback = async (req, res, next) => {
        try {
            const code = req.query.code;
            const state = req.query.state;
            if (!code || !state) {
                return res.redirect(`http://localhost:3000/auth/callback?error=${encodeURIComponent('Missing code or state')}`);
            }
            const { accessToken, refreshToken } = await this.authService.handleGoogleCallback(code, state);
            this.setCookie(res, refreshToken);
            // Redirect back to frontend callback with token
            res.redirect(`http://localhost:3000/auth/callback?token=${accessToken}`);
        }
        catch (err) {
            const msg = err?.message || 'Google authentication failed';
            res.redirect(`http://localhost:3000/auth/callback?error=${encodeURIComponent(msg)}`);
        }
    };
    adminLogin = async (req, res, next) => {
        try {
            const identifier = req.body.email || req.body.identifier;
            const { accessToken, refreshToken, user } = await this.authService.adminLogin(identifier, req.body.password);
            this.setCookie(res, refreshToken);
            res.json({ success: true, data: { accessToken, user } });
        }
        catch (err) {
            next(err);
        }
    };
    refreshToken = async (req, res, next) => {
        try {
            const token = req.cookies.refreshToken;
            if (!token)
                throw new errors_1.AppError('No refresh token provided', 401, 'UNAUTHORIZED');
            const ip = req.ip || '0.0.0.0';
            const userAgent = req.headers['user-agent'] || 'unknown';
            const { accessToken, refreshToken } = await this.authService.refreshToken(token, ip, userAgent);
            this.setCookie(res, refreshToken);
            res.json({ success: true, data: { accessToken } });
        }
        catch (err) {
            next(err);
        }
    };
    logout = async (req, res, next) => {
        try {
            const token = req.cookies.refreshToken;
            if (token) {
                await this.authService.logout(token);
            }
            res.clearCookie('refreshToken');
            res.json({ success: true, message: 'Logged out successfully' });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.AuthController = AuthController;
