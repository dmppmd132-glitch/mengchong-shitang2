import { DailyTask } from '../types';

export type TaskId = 'feed_1' | 'pet_3' | 'clean_1' | 'weigh_1';

export const DAILY_TASK_TEMPLATES: DailyTask[] = [
  {
    id: 'feed_1',
    title: '餵食 1 次',
    description: '在食堂挑選喜歡的食物餵給小豬吃。',
    target: 1,
    progress: 0,
    completed: false,
    claimed: false,
    reward: {
      coins: 35,
      foodId: 'veggie_porridge',
      foodQty: 1,
    },
  },
  {
    id: 'pet_3',
    title: '摸摸 3 次',
    description: '輕點主畫面的小豬，給牠 3 次暖心摸摸。',
    target: 3,
    progress: 0,
    completed: false,
    claimed: false,
    reward: {
      coins: 30,
      foodId: 'caramel_pudding',
      foodQty: 1,
    },
  },
  {
    id: 'clean_1',
    title: '清理 1 次',
    description: '按下「洗澡」按鈕幫小豬洗出香香泡泡澡。',
    target: 1,
    progress: 0,
    completed: false,
    claimed: false,
    reward: {
      coins: 30,
      foodId: 'carrot_salad',
      foodQty: 1,
    },
  },
  {
    id: 'weigh_1',
    title: '記錄體重 1 次',
    description: '到「成長手帳」手動輸入或調整一次體重紀錄。',
    target: 1,
    progress: 0,
    completed: false,
    claimed: false,
    reward: {
      coins: 40,
      foodId: 'butter_cookie',
      foodQty: 2,
    },
  },
];

export function createInitialDailyTasks(): DailyTask[] {
  return DAILY_TASK_TEMPLATES.map((task) => ({
    ...task,
    reward: { ...task.reward },
  }));
}
