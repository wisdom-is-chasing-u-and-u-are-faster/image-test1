export interface SimulationAgent {
  id: string;
  name: string;
  category: string;
  activeP1P2: number;
  totalActive: number;
  maxTotal: number;
}

export function simulateWorkloadDistribution(ticketsCount: number): Record<string, number> {
  const agents: SimulationAgent[] = [
    { id: 'agent-1', name: 'Bob DBA', category: 'PostgreSQL', activeP1P2: 0, totalActive: 0, maxTotal: 15 },
    { id: 'agent-2', name: 'Carol Support', category: 'PostgreSQL', activeP1P2: 0, totalActive: 0, maxTotal: 15 }
  ];

  const distribution: Record<string, number> = { 'agent-1': 0, 'agent-2': 0, 'unassigned': 0 };

  for (let i = 0; i < ticketsCount; i++) {
    // Select lowest active
    const candidate = [...agents].sort((a, b) => a.totalActive - b.totalActive)[0];
    if (candidate && candidate.totalActive < candidate.maxTotal) {
      candidate.totalActive++;
      distribution[candidate.id]++;
    } else {
      distribution['unassigned']++;
    }
  }

  return distribution;
}

const result = simulateWorkloadDistribution(50);
console.log('Workload distribution across 50 tickets:', result);
