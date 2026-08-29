import cron from 'node-cron';
import { updateNDCUDengueData } from '../services/ndcuService.js';

export const startNDCUUpdater = () => {
  // Run every 6 hours: 0 */6 * * *
  cron.schedule('0 */6 * * *', async () => {
    console.log('[CRON] Running scheduled NDCU Dengue Data Update...');
    await updateNDCUDengueData();
  });
  console.log('[CRON] NDCU Updater scheduled (Runs every 6 hours)');
};
