import { AuthRequest } from "../middleware/auth";
import { Response } from "express";
import prisma from "../prisma";
import { Priority } from "@prisma/client";
import { Prisma } from "@prisma/client";



export const createTask = async (req: AuthRequest, res: Response) => {

const { title, description, priority, dueDate } = req.body;


  if (!title) return res.status(400).json({ message: "Title required" });

const task = await prisma.task.create({
  data: {
    title,
    description,
    priority: priority as Priority,   // ✅ FIX
    dueDate: dueDate ? new Date(dueDate) : null,
    userId: req.userId!,
  },
});
  res.status(201).json(task);
};

export const getTasks = async (req: AuthRequest, res: Response) => {
const { page="1", limit="5", status, search, sort } = req.query;

let orderBy: Prisma.TaskOrderByWithRelationInput;

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

  const where: any = {
    userId: req.userId,
  };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.title = {
      contains: search as string,
      mode: "insensitive",
    };
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy,
    skip: (pageNumber - 1) * limitNumber,
    take: limitNumber,
  });

  const total = await prisma.task.count({ where });

  res.json({ tasks, total });
};



export const updateTask = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  const { title, description, status, priority, dueDate } = req.body;

  const task = await prisma.task.findFirst({
    where: { id, userId: req.userId },
  });

  if (!task) return res.status(404).json({ message: "Task not found" });

const updated = await prisma.task.update({
  where: { id },
  data: {
    title,
    description,
    status,
    priority,
    dueDate: dueDate ? new Date(dueDate) : null,
  },
})

  res.json(updated);
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
      const id = req.params.id as string;
  const task = await prisma.task.findFirst({
    where: { id, userId: req.userId },
  });

  if (!task) return res.status(404).json({ message: "Task not found" });

  await prisma.task.delete({ where: { id } });

  res.json({ message: "Task deleted" });
};

export const toggleTask = async (req: AuthRequest, res: Response) => {
      const id = req.params.id as string;
  const task = await prisma.task.findFirst({
    where: { id, userId: req.userId },
  });

  if (!task) return res.status(404).json({ message: "Task not found" });

  const updated = await prisma.task.update({
    
    where: { id },
    data: {
      status: task.status === "PENDING" ? "COMPLETED" : "PENDING",
    },
  });

  res.json(updated);
};
