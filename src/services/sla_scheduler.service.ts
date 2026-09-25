import { cloudTasksConfig } from '../config';

export interface ScheduledTaskInfo {
  taskId: string;
  milestone: '50%' | '75%' | '100%';
  scheduleTime: Date;
  ticketId: string;
}

export class SlaSchedulerService {
  private static taskQueue: ScheduledTaskInfo[] = [];

  public static async scheduleMilestones(ticketId: string, createdAt: Date, resolveDeadline: Date): Promise<ScheduledTaskInfo[]> {
    const totalDuration = resolveDeadline.getTime() - createdAt.getTime();
    const milestones: Array<'50%' | '75%' | '100%'> = ['50%', '75%', '100%'];
    const multipliers = [0.5, 0.75, 1.0];

    const tasks: ScheduledTaskInfo[] = [];

    for (let i = 0; i < milestones.length; i++) {
      const scheduleTime = new Date(createdAt.getTime() + totalDuration * multipliers[i]);
      const taskInfo: ScheduledTaskInfo = {
        taskId: `tasks-${ticketId}-${milestones[i].replace('%', 'pct')}`,
        milestone: milestones[i],
        scheduleTime,
        ticketId
      };
      this.taskQueue.push(taskInfo);
      tasks.push(taskInfo);
    }

    return tasks;
  }

  public static getScheduledTasksForTicket(ticketId: string): ScheduledTaskInfo[] {
    return this.taskQueue.filter(t => t.ticketId === ticketId);
  }

  public static clearTasks(): void {
    this.taskQueue = [];
  }
}
