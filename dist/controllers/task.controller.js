"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleTask = exports.deleteTask = exports.updateTask = exports.getTasks = exports.createTask = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const createTask = async (req, res) => {
    const { title, description, priority, dueDate } = req.body;
    if (!title)
        return res.status(400).json({ message: "Title required" });
    const task = await prisma_1.default.task.create({
        data: {
            title,
            description,
            priority: priority, // ✅ FIX
            dueDate: dueDate ? new Date(dueDate) : null,
            userId: req.userId,
        },
    });
    res.status(201).json(task);
};
exports.createTask = createTask;
const getTasks = async (req, res) => {
    const { page = "1", limit = "5", status, search, sort } = req.query;
    let orderBy;
    switch (sort) {
        case "oldest":
            orderBy = { createdAt: "asc" };
            break;
        case "priority":
            orderBy = { priority: "desc" };
            break;
        case "due":
            orderBy = { dueDate: "asc" };
            break;
        default:
            orderBy = { createdAt: "desc" };
    }
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 5;
    const where = {
        userId: req.userId,
    };
    if (status) {
        where.status = status;
    }
    if (search) {
        where.title = {
            contains: search,
            mode: "insensitive",
        };
    }
    const tasks = await prisma_1.default.task.findMany({
        where,
        orderBy,
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
    });
    const total = await prisma_1.default.task.count({ where });
    res.json({ tasks, total });
};
exports.getTasks = getTasks;
const updateTask = async (req, res) => {
    const id = req.params.id;
    const { title, description, status, priority, dueDate } = req.body;
    const task = await prisma_1.default.task.findFirst({
        where: { id, userId: req.userId },
    });
    if (!task)
        return res.status(404).json({ message: "Task not found" });
    const updated = await prisma_1.default.task.update({
        where: { id },
        data: {
            title,
            description,
            status,
            priority,
            dueDate: dueDate ? new Date(dueDate) : null,
        },
    });
    res.json(updated);
};
exports.updateTask = updateTask;
const deleteTask = async (req, res) => {
    const id = req.params.id;
    const task = await prisma_1.default.task.findFirst({
        where: { id, userId: req.userId },
    });
    if (!task)
        return res.status(404).json({ message: "Task not found" });
    await prisma_1.default.task.delete({ where: { id } });
    res.json({ message: "Task deleted" });
};
exports.deleteTask = deleteTask;
const toggleTask = async (req, res) => {
    const id = req.params.id;
    const task = await prisma_1.default.task.findFirst({
        where: { id, userId: req.userId },
    });
    if (!task)
        return res.status(404).json({ message: "Task not found" });
    const updated = await prisma_1.default.task.update({
        where: { id },
        data: {
            status: task.status === "PENDING" ? "COMPLETED" : "PENDING",
        },
    });
    res.json(updated);
};
exports.toggleTask = toggleTask;
