import { createApp } from './app';
import { env } from './config/env';
import { startScheduler } from './jobs/scheduler';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`task-manager backend listening on port ${env.PORT}`);
  startScheduler();
});
