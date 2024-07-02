export const ONCHAIN_QUEUES = {
  QUEUE_CREATE_GAME: 'QUEUE_CREATE_GAME',
  QUEUE_SETTLE_GAME: 'QUEUE_SETTLE_GAME',
};

export const ONCHAIN_JOBS = {
  JOB_CREATE_GAME: 'JOB_CREATE_GAME',
  JOB_SETTLE_GAME: 'JOB_SETTLE_GAME',
};

export const MQ_JOB_DEFAULT_CONFIG = {
  removeOnComplete: true,
  removeOnFail: {
    count: 1000, // keep up to 1000 jobs
  },
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
};
