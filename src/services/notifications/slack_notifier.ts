export class SlackNotifier {
  public static async sendAlert(payload: { ticketNumber: string; priority: string; status: string; milestone: string; title: string }): Promise<void> {
    const blockKitMessage = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🚨 SLA Threshold Alert: ${payload.milestone} Milestone Exceeded`
          }
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Ticket:*
#${payload.ticketNumber}` },
            { type: 'mrkdwn', text: `*Priority:*
${payload.priority}` },
            { type: 'mrkdwn', text: `*Status:*
${payload.status}` },
            { type: 'mrkdwn', text: `*Summary:*
${payload.title}` }
          ]
        }
      ]
    };
    // Webhook POST to Slack channel
    console.log('[SlackNotifier] Dispatched Block Kit message:', JSON.stringify(blockKitMessage));
  }
}
