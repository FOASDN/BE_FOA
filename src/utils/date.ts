export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const ONE_HOUR_MS = 60 * 60 * 1000;

export const thirtyDaysFromNow = () => {
  return new Date(Date.now() + 30 * ONE_DAY_MS);
};

export const fifteenMinutesFromNow = () => {
  return new Date(Date.now() + 15 * 60 * 1000);
};

export const fiveMinutesAgo = () => {
  return new Date(Date.now() - 5 * 60 * 1000);
};
export const oneHourFromNow = () => {
  return new Date(Date.now() + 1 * ONE_HOUR_MS);
};
