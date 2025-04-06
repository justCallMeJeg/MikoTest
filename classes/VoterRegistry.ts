// -------------------- VoterRegistry.ts --------------------
export class Voter {
  constructor(
    public publicKey: string,
    public department: string,
    public kycVerified: boolean = false
  ) {}
}

export default class VoterRegistry {
  private static instance: VoterRegistry;
  private voters: Map<string, Voter> = new Map();

  private constructor() {}

  static getInstance(): VoterRegistry {
    if (!VoterRegistry.instance) {
      VoterRegistry.instance = new VoterRegistry();
    }
    return VoterRegistry.instance;
  }

  registerVoter(voter: Voter): void {
    this.voters.set(voter.publicKey, voter);
  }

  isVoterValid(publicKey: string): boolean {
    const voter = this.voters.get(publicKey);
    return !!voter && voter.kycVerified;
  }

  getVoterDepartment(publicKey: string): string | null {
    return this.voters.get(publicKey)?.department || null;
  }
}