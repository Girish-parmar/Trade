import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import {
  refreshTtlToDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../lib/jwt';

const SALT_ROUNDS = 12;

function hashToken(token: string) {
  return bcrypt.hash(token, 10);
}

async function issueTokenPair(userId: string, email: string) {
  const accessToken = signAccessToken({ sub: userId, email });
  const jti = uuidv4();
  const refreshToken = signRefreshToken({ sub: userId, jti });
  const tokenHash = await hashToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      id: jti,
      userId,
      tokenHash,
      expiresAt: refreshTtlToDate(),
    },
  });
  return { accessToken, refreshToken };
}

export async function register(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, 'Email already registered');
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({ data: { email, passwordHash, name } });
  const tokens = await issueTokenPair(user.id, user.email);
  return { user, ...tokens };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new HttpError(401, 'Invalid email or password');
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, 'Invalid email or password');
  }
  const tokens = await issueTokenPair(user.id, user.email);
  return { user, ...tokens };
}

export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new HttpError(401, 'Invalid or expired refresh token');
  }
  const stored = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new HttpError(401, 'Refresh token no longer valid');
  }
  const matches = await bcrypt.compare(refreshToken, stored.tokenHash);
  if (!matches) {
    throw new HttpError(401, 'Refresh token no longer valid');
  }
  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) {
    throw new HttpError(401, 'User no longer exists');
  }
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });
  const tokens = await issueTokenPair(user.id, user.email);
  return { user, ...tokens };
}

export async function logout(refreshToken: string | undefined) {
  if (!refreshToken) return;
  try {
    const payload = verifyRefreshToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { id: payload.jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    // token already invalid/expired - nothing to revoke
  }
}
