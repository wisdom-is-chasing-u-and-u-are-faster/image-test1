import { SlackNotifier } from '../services/notifications/slack_notifier';
import { TeamsNotifier } from '../services/notifications/teams_notifier';
import { EmailNotifier } from '../services/notifications/email_notifier';

export class NotificationWorker {
  public static async handleSlaAlert(event: { ticketNumber: string; priority: string; status: string; milestone: string; title: string }): Promise<void> {
    await Promise.all([
      SlackNotifier.sendAlert(event),
      TeamsNotifier.sendAlert(event),
      EmailNotifier.sendAlert('ops-lead@corp.internal', `[ALERT] ${event.milestone} SLA Exceeded`, event.title)
    ]);
  }
}
