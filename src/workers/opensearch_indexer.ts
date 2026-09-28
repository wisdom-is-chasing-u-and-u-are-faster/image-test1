import { IndexingService } from '../services/indexing.service';

export class OpenSearchIndexerWorker {
  public static async handleEvent(event: any): Promise<void> {
    await IndexingService.indexTicket(event);
  }
}
