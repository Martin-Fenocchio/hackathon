export interface TextSolverResult {
    recipient: {
        type: 'publicKey' | 'contactName';
        value: string;
    };
    amount: number;
} 

export interface RecipientSolverResult {
	publicKey: string;
}