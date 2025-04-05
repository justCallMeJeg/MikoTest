// -------------------- Voter Registry --------------------
export default class VoterRegistry {
  private static instance: VoterRegistry;
  private allowedVoters: Set<string> = new Set();

  private constructor() {}

  static getInstance(): VoterRegistry {
    if (!VoterRegistry.instance) {
      VoterRegistry.instance = new VoterRegistry();
    }
    return VoterRegistry.instance;
  }

  registerVoter(publicKey: string): void {
    this.allowedVoters.add(publicKey);
  }

  isVoterValid(publicKey: string): boolean {
    return this.allowedVoters.has(publicKey);
  }
}
