"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refresh = exports.login = exports.register = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../utils/jwt");
const register = async (req, res) => {
    const { name, email, password } = req.body;
    const hashed = await bcrypt_1.default.hash(password, 10);
    const user = await prisma_1.default.user.create({
        data: { name, email, password: hashed }
    });
    res.status(201).json({ message: "User created" });
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user)
            return res.status(401).json({ message: "Invalid credentials" });
        const match = await bcrypt_1.default.compare(password, user.password);
        if (!match)
            return res.status(401).json({ message: "Invalid credentials" });
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { refreshToken }
        });
        res.json({
            accessToken,
            refreshToken, // ✅ THIS WAS MISSING
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Login failed" });
    }
};
exports.login = login;
const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token" });
        }
        const payload = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await prisma_1.default.user.findUnique({
            where: { id: payload.userId },
        });
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }
        const newAccessToken = (0, jwt_1.generateAccessToken)(user.id);
        res.json({
            accessToken: newAccessToken,
            user: { id: user.id, email: user.email },
        });
    }
    catch (err) {
        console.error("REFRESH ERROR:", err);
        res.status(403).json({ message: "Refresh failed" });
    }
};
exports.refresh = refresh;
const logout = async (req, res) => {
    const { refreshToken } = req.body;
    console.log(refreshToken);
    if (refreshToken) {
        await prisma_1.default.user.updateMany({
            where: { refreshToken },
            data: { refreshToken: null }
        });
    }
    res.json({ message: "Logged out" });
};
exports.logout = logout;
