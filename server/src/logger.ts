import pino from 'pino';
import { Writable } from 'stream';
import { writeServerLog } from './utils/file-logger.js';

const isDev = process.env.NODE_ENV !== 'production';

const streams: pino.StreamEntry[] = [
  {
    level: isDev ? 'debug' : 'info',
    stream: isDev
      ? pino.transport({ target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } })
      : process.stdout,
  },
];

// In production, also write to rotated server log file
if (!isDev) {
  const fileStream = new Writable({
    write(chunk: Buffer, _enc: string, cb: () => void) {
      try {
        const line = chunk.toString().trim();
        if (line) writeServerLog(line);
      } catch { /* ignore */ }
      cb();
    },
  });

  streams.push({ level: 'info', stream: fileStream });
}

export const logger = pino(
  { level: isDev ? 'debug' : 'info' },
  pino.multistream(streams),
);
