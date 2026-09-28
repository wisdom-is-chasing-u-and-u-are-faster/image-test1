export class EmailNotifier {
  public static async sendAlert(to: string, subject: string, html: string): Promise<void> {
    console.log(`[EmailNotifier] Dispatched HTML email alert to ${to}: ${subject}`);
  }
}
