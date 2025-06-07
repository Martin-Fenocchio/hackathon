export interface SolverResult {
    recipient: {
        type: 'publicKey' | 'contactName';
        value: string;
    };
    amount: number;
    confidence: number;
} 