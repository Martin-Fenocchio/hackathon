import { TextSolverResult } from '../../solver/interfaces/solver-result.interface';

export interface OrchestratorResult extends TextSolverResult {
  destination?: {
    publicKey: string;
  };
}
