import { QualifiedAgent, AgentWorkloadRepository } from '../repositories/agent_workload.repository';
import { PoolClient } from 'pg';

export class AgentMatchingService {
  /**
   * Least-loaded matching algorithm with capacity safety caps.
   * Prioritizes agents with skill matches, lowest active workload, and highest proficiency.
   */
  public static async selectBestAgent(
    departmentId: string,
    category: string,
    priority: 'P1' | 'P2' | 'P3' | 'P4',
    client?: PoolClient
  ): Promise<QualifiedAgent | null> {
    const candidates = await AgentWorkloadRepository.findQualifiedAgents(departmentId, category, client);

    const eligible = candidates.filter(agent => {
      if (agent.totalActiveCount >= agent.maxTotalCapacity) return false;
      if ((priority === 'P1' || priority === 'P2') && agent.activeP1P2Count >= agent.maxP1P2Capacity) {
        return false;
      }
      return true;
    });

    if (eligible.length === 0) {
      return null;
    }

    // Sort by: lowest active load -> highest proficiency
    eligible.sort((a, b) => {
      if (a.totalActiveCount !== b.totalActiveCount) {
        return a.totalActiveCount - b.totalActiveCount;
      }
      return b.proficiencyLevel - a.proficiencyLevel;
    });

    return eligible[0];
  }
}
