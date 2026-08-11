import cron from 'node-cron';
import { env } from '../config/env';
import { runDueDateScan } from './dueDateScan.job';

export function startScheduler() {
  cron.schedule(env.CRON_DUE_SCAN, () => {
    runDueDateScan().catch((err) => {
      console.error('dueDateScan job failed:', err);
    });
  });
}
