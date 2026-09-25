export class TeamsNotifier {
  public static async sendAlert(payload: { ticketNumber: string; priority: string; milestone: string; title: string }): Promise<void> {
    const adaptiveCard = {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        { type: 'TextBlock', text: `⚠️ SLA Alert: ${payload.milestone}`, weight: 'Bolder', size: 'Medium' },
        { type: 'TextBlock', text: `Ticket #${payload.ticketNumber}: ${payload.title}`, wrap: true },
        { type: 'FactSet', facts: [{ title: 'Priority', value: payload.priority }] }
      ]
    };
    console.log('[TeamsNotifier] Dispatched Adaptive Card message:', JSON.stringify(adaptiveCard));
  }
}
