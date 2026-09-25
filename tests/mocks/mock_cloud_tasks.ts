export interface MockTask {
  name: string;
  scheduleTime: Date;
  payload: any;
}

export class MockCloudTasksClient {
  public tasks: MockTask[] = [];

  public async createTask(request: { parent: string; task: { scheduleTime: { seconds: number }; httpRequest: { body: string } } }): Promise<[MockTask]> {
    const task: MockTask = {
      name: `projects/etms-test/locations/us-central1/queues/sla/tasks/${Date.now()}-${Math.random()}`,
      scheduleTime: new Date(request.task.scheduleTime.seconds * 1000),
      payload: JSON.parse(Buffer.from(request.task.httpRequest.body, 'base64').toString('utf8'))
    };
    this.tasks.push(task);
    return [task];
  }

  public clear(): void {
    this.tasks = [];
  }
}
