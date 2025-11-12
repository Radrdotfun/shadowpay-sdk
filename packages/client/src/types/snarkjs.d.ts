declare module 'snarkjs' {
  export const groth16: {
    fullProve: (
      inputs: any,
      wasmPath: string,
      zkeyPath: string
    ) => Promise<{
      proof: any;
      publicSignals: any[];
    }>;
    verify: (
      vKey: any,
      publicSignals: any[],
      proof: any
    ) => Promise<boolean>;
  };
  
  export function zKey: any;
  export function r1cs: any;
  export function wtns: any;
  export function powersOfTau: any;
}

