import { OpenSearchClient, OpenSearchDoc } from '../clients/opensearch.client';

export class IndexingService {
  public static async indexTicket(doc: OpenSearchDoc): Promise<void> {
    await OpenSearchClient.indexDocument(doc);
  }
}
