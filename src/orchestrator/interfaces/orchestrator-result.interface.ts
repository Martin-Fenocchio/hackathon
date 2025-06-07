import { SolverResult } from '../../solver/interfaces/solver-result.interface';

export interface OrchestratorResult extends SolverResult {
    destination?: {
        publicKey: string;
        confidence: number;
    };
} 