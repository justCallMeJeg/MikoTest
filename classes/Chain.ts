import * as crypto from 'crypto';
import Block from "./Block";
import Vote from "./Vote";
import VoterRegistry from "./VoterRegistry";

// -------------------- Chain --------------------
export default class Chain {
  public static instance = new Chain();
  public chain: Block[];
  public validators: Map<string, boolean> = new Map();
  private readonly REQUIRED_SIGNATURES = 2;
  private readonly MAX_VOTE_AGE_MS = 300000; // 5 minutes

  private constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  private createGenesisBlock(): Block {
    const genesisVote = new Vote('system', 'genesis', 0);
    const genesisBlock = new Block('', genesisVote);
    this.validators.set('genesis-validator', true); // Special genesis validator
    return genesisBlock;
  }

  get lastBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  addBlock(block: Block): void {
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

  tallyVotes(): { [candidate: string]: number } {
    const tally: { [candidate: string]: number } = {};

    // Skip genesis block
    for (let i = 1; i < this.chain.length; i++) {
      const candidate = this.chain[i].vote.candidate;
      tally[candidate] = (tally[candidate] || 0) + 1;
    }

    return tally;
  }

  displayResults(): void {
    const tally = this.tallyVotes();
    console.log('\nElection Results:');
    console.log('-----------------');
    for (const [candidate, votes] of Object.entries(tally)) {
      console.log(`${candidate}: ${votes} vote${votes !== 1 ? 's' : ''}`);
    }
    console.log('-----------------');
  }
}
