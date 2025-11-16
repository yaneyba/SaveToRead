/**
 * JWT Utilities
 *
 * Sign and verify JWT tokens using jose library
 */

import * as jose from 'jose';

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Sign a JWT token
 */
export async function sign(payload: JWTPayload, secret: string, expiresIn = '7d'): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  const jwt = await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);

  return jwt;
}

/**
 * Verify a JWT token
 */
export async function verify(token: string, secret: string): Promise<JWTPayload> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  const { payload } = await jose.jwtVerify(token, secretKey);

  // Validate and convert jose.JWTPayload to our JWTPayload type
  if (typeof payload.userId !== 'string' || typeof payload.email !== 'string') {
    throw new Error('Invalid token payload: missing userId or email');
  }

  return {
    userId: payload.userId,
    email: payload.email,
    iat: payload.iat,
    exp: payload.exp
  };
}
