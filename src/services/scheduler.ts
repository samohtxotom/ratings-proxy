import * as cron from 'node-cron';
import { config } from '../config';
import { updateDatabase } from './dataLoader';

let scheduledTask: cron.ScheduledTask | null = null;

export function startScheduler(): void {
  if (scheduledTask) {
    console.log('Scheduler already running');
    return;
  }

  console.log(`Scheduling daily updates at: ${config.updateCronSchedule}`);

  scheduledTask = cron.schedule(config.updateCronSchedule, async () => {
    console.log('Running scheduled database update...');
    try {
      await updateDatabase();
      console.log('Scheduled update completed successfully');
    } catch (error) {
      console.error('Scheduled update failed:', error);
    }
  });

  console.log('Scheduler started');
}

export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('Scheduler stopped');
  }
}
