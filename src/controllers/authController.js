import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';

import { User } from '../models/user.js';
import { Session } from '../models/session.js';

import { createSession, setSessionCookies } from '../services/auth.js';

import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/sendMail.js';

import handlebars from 'handlebars';

import path from 'node:path';
import fs from 'node:fs/promises';

export const registerUser = async (req, res, next) => {
  const { email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createHttpError(400, 'Email in use');
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    email,
    password: hashedPassword,
  });

  const newSession = await createSession(newUser._id);
  setSessionCookies(res, newSession);
  res.status(201).json(newUser);
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw createHttpError(401, 'Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw createHttpError(401, 'Invalid credentials');
  }

  await Session.deleteOne({ userId: user._id });
  const newSession = await createSession(user._id);
  setSessionCookies(res, newSession);
  res.status(200).json(user);
};

export const refreshUserSession = async (req, res, next) => {
  const session = await Session.findOne({
    _id: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });
  if (!session) {
    throw createHttpError(401, 'Session not found');
  }
  const isSessionTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);
  if (isSessionTokenExpired) {
    throw createHttpError(401, 'Session token expired');
  }
  await Session.deleteOne({ _id: session._id });
  const newSession = await createSession(session.userId);
  setSessionCookies(res, newSession);
  res.status(200).json({
    accessToken: newSession.accessToken,
    message: 'Session refreshed',
  });
};

export const logoutUser = async (req, res, next) => {
  const { sessionId } = req.cookies;

  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });
  }

  res.clearCookie('sessionId');
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(204).send();
};

export const requestResetEmail = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(200).json({
      message: 'Password reset email sent successfully',
    });
    return;
  }

  const resetToken = jwt.sign(
    { sub: user._id, email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  );

  // 1. Формуємо шлях до шаблона
  const templatePath = path.resolve('src/templates/reset-password-email.html');
  // 2. Читаємо шаблон
  const templateSource = await fs.readFile(templatePath, 'utf-8');
  // 3. Готуємо шаблон до заповнення
  const template = handlebars.compile(templateSource);
  // 4. Формуємо із шаблона HTML документ з динамічними даними
  const html = template({
    name: user.username,
    link: `${process.env.FRONTEND_DOMAIN}/reset-password?token=${resetToken}`,
  });

  try {
    await sendEmail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Password Reset Request',
      html,
    });
  } catch (error) {
    console.error('EMAIL ERROR:', error);
    throw createHttpError(
      500,
      'Failed to send the email, please try again later.',
    );
  }

  res.status(200).json({
    message: 'Password reset email sent successfully',
  });
};

export const resetPassword = async (req, res, next) => {
  const { password, token } = req.body;
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw createHttpError(401, 'Invalid or expired token');
  }
  const user = await User.findOne({
    _id: payload.sub,
    email: payload.email,
  });
  if (!user) {
    throw createHttpError(404, 'User not found');
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  await User.updateOne({ _id: user._id }, { password: hashedPassword });

  await Session.deleteMany({ userId: user._id });
  res.status(200).json({
    message: 'Password reset successfully',
  });
};
