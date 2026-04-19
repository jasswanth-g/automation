import cron from 'node-cron';
import axios from 'axios';

export const initCronJobs = () => {
  const apiUrl = process.env.CRON_API_URL;

  if (!apiUrl) {
    console.warn('CRON_API_URL is not defined in environment variables. Cron job will not start.');
    return;
  }

  // Schedule a task to run every day at 6:00 PM (18:00)
  cron.schedule('0 18 * * *', async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Running cron job: Hitting ${apiUrl}`);

    try {
      const response = await axios.get(apiUrl);
      console.log(`[${timestamp}] Cron job success: Status ${response.status}`);
    } catch (error: any) {
      console.error(`[${timestamp}] Cron job error:`, error.message);
    }
  });

  console.log('Cron jobs initialized: Running every day at 6:00 PM (18:00)');
};
