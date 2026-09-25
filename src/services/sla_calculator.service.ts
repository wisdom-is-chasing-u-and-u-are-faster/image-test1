export interface SlaDeadlines {
  slaAckDeadline: Date;
  slaResolveDeadline: Date;
}

export class SlaCalculatorService {
  /**
   * Enterprise SLA Tiers:
   * - P1: ACK = 15m, Resolve = 2h
   * - P2: ACK = 30m, Resolve = 4h
   * - P3: ACK = 2h,  Resolve = 24h
   * - P4: ACK = 4h,  Resolve = 72h
   */
  public static calculate(priority: 'P1' | 'P2' | 'P3' | 'P4', fromDate: Date = new Date()): SlaDeadlines {
    const ackDeadline = new Date(fromDate.getTime());
    const resolveDeadline = new Date(fromDate.getTime());

    switch (priority) {
      case 'P1':
        ackDeadline.setMinutes(ackDeadline.getMinutes() + 15);
        resolveDeadline.setHours(resolveDeadline.getHours() + 2);
        break;
      case 'P2':
        ackDeadline.setMinutes(ackDeadline.getMinutes() + 30);
        resolveDeadline.setHours(resolveDeadline.getHours() + 4);
        break;
      case 'P3':
        ackDeadline.setHours(ackDeadline.getHours() + 2);
        resolveDeadline.setHours(resolveDeadline.getHours() + 24);
        break;
      case 'P4':
        ackDeadline.setHours(ackDeadline.getHours() + 4);
        resolveDeadline.setHours(resolveDeadline.getHours() + 72);
        break;
    }

    return {
      slaAckDeadline: ackDeadline,
      slaResolveDeadline: resolveDeadline
    };
  }

  public static getMilestoneTimes(startTime: Date, resolveDeadline: Date): { milestone50: Date; milestone75: Date; milestone100: Date } {
    const totalDuration = resolveDeadline.getTime() - startTime.getTime();
    return {
      milestone50: new Date(startTime.getTime() + totalDuration * 0.5),
      milestone75: new Date(startTime.getTime() + totalDuration * 0.75),
      milestone100: resolveDeadline
    };
  }
}
