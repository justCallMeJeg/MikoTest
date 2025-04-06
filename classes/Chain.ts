import * as crypto from 'crypto';
import Block from "./Block";
import Vote from "./Vote";
import VoterRegistry from "./VoterRegistry";

// Added position configuration
interface ElectionPosition {
  name: string;
  scope: 'GLOBAL' | 'LOCAL';
  allowedLocals?: string[];
}

// -------------------- Chain --------------------
export default class Chain {
  public static instance = new Chain();
  public chain: Block[];
  public validators: Map<string, boolean> = new Map();
  private readonly REQUIRED_SIGNATURES = 2;
  private readonly MAX_VOTE_AGE_MS = 300000; // 5 minutes
  private positions: ElectionPosition[] = [];

  private constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  private createGenesisBlock(): Block {
    const genesisVote = new Vote('system', 'genesis', 'genesis', 'genesis', 0);
    const genesisBlock = new Block('', genesisVote);
    this.validators.set('genesis-validator', true); // Special genesis validator
    return genesisBlock;
  }

  get lastBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  addBlock(block: Block): void {
    const voterDept = VoterRegistry.getInstance().getVoterDepartment(block.vote.voterPublicKey);
    
    // New position validation
    const position = this.positions.find(p => p.name === block.vote.position);
    if (position) {
      if (position.scope === 'LOCAL' && 
          voterDept !== block.vote.department) {
        console.log('Block rejected: Vote Locality mismatch');
        return;
      }

      if (position.allowedLocals && 
          !position.allowedLocals.includes(block.vote.department)) {
        console.log('Block rejected: Invalid department for position');
        return;
      }
    }

    // Existing validation checks
    if (!VoterRegistry.getInstance().isVoterValid(block.vote.voterPublicKey)) {
      console.log('Block rejected: Unregistered voter');
      return;
    }

    // Voter validation
    if (!VoterRegistry.getInstance().isVoterValid(block.vote.voterPublicKey)) {
      console.log('Block rejected: Unregistered voter');
      return;
    }

    // Time validation
    if (Date.now() - block.vote.timestamp > this.MAX_VOTE_AGE_MS) {
      console.log('Block rejected: Expired vote');
      return;
    }

    // Signature validation
    let validSignatures = 0;
    for (const [publicKey, signature] of block.signatures) {
      if (this.validators.get(publicKey)) {
        const verify = crypto.createVerify('SHA256');
        verify.update(block.signData);
        if (verify.verify(publicKey, signature)) {
          validSignatures++;
        }
      }
    }

    if (validSignatures < this.REQUIRED_SIGNATURES) {
      console.log(`Block rejected: Requires ${this.REQUIRED_SIGNATURES} validator signatures`);
      return;
    }

    // Hash chain validation
    if (block.previousHash !== this.lastBlock.hash) {
      console.log('Block rejected: Invalid chain link');
      return;
    }

    // Add to chain
    this.chain.push(block);
    console.log(`Block added: ${block.hash}`);
  }

  // Add position configuration
  configurePosition(position: ElectionPosition): void {
    this.positions.push(position);
  }

  // Enhanced tally system
  tallyVotes(): { [position: string]: { [candidate: string]: number } } {
    const tally: { [position: string]: { [candidate: string]: number } } = {};

    for (let i = 1; i < this.chain.length; i++) {
      const vote = this.chain[i].vote;
      if (!tally[vote.position]) tally[vote.position] = {};
      tally[vote.position][vote.candidate] = (tally[vote.position][vote.candidate] || 0) + 1;
    }

    return tally;
  }

  displayResults(): void {
    const tally = this.tallyVotes();
    console.log('\nElection Results:');
    console.log('-----------------');
    for (const [position, candidates] of Object.entries(tally)) {
      console.log(`Position: ${position}`);
      for (const [candidate, votes] of Object.entries(candidates)) {
        console.log(`  ${candidate}: ${votes} vote${votes !== 1 ? 's' : ''}`);
      }
    }
    console.log('-----------------');
  }
}
