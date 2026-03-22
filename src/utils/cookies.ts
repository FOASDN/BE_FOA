import { CookieOptions, Response } from 'express';
import { fifteenMinutesFromNow, thirtyDaysFromNow } from './date';

const secure = process.env.NODE_ENV !== 'development';
export const REFRESH_PATH = '/api/auth/refresh';

const defaults: CookieOptions = {
  sameSite: 'lax',
  secure,
  httpOnly: true,
};

export const getAccessTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: fifteenMinutesFromNow(),
});

export const getRefreshTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: thirtyDaysFromNow(),
  path: REFRESH_PATH,
});

type Params = {
  res: Response;
  accessToken: string;
  refreshToken: string;
  deviceId?: string;
};

export const setAuthCookies = ({ res, accessToken, refreshToken, deviceId }: Params): Response => {
  return res
    .cookie('accessToken', accessToken, getAccessTokenCookieOptions())
    .cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions())
    .cookie('deviceId', deviceId);
};

export const clearAuthCookies = (res: Response) => {
  return res.clearCookie('accessToken').clearCookie('refreshToken', {
    path: REFRESH_PATH,
  });
};
