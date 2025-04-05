import * as crypto from 'crypto';

// -------------------- Voter Registry --------------------
class VoterRegistry {
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

// -------------------- Vote --------------------
class Vote {
  public signature: Buffer | undefined;

  constructor(
    public readonly voterPublicKey: string,
    public readonly candidate: string,
    public readonly timestamp: number = Date.now()
  ) {}

  toString(): string {
    return JSON.stringify({
      voterPublicKey: this.voterPublicKey,
      candidate: this.candidate,
      timestamp: this.timestamp
    });
  }

  sign(privateKey: string): void {
    const sign = crypto.createSign('SHA256');
    sign.update(this.toString());
    this.signature = sign.sign(privateKey);
  }
}

// -------------------- Block --------------------
class Block {
  public signatures: Map<string, Buffer> = new Map();

  constructor(
    public readonly previousHash: string,
    public readonly vote: Vote,
    public readonly timestamp: number = Date.now()
  ) {}

  get signData(): string {
    return JSON.stringify({
      previousHash: this.previousHash,
      vote: this.vote.toString(),
      timestamp: this.timestamp
    });
  }

  addValidatorSignature(publicKey: string, privateKey: string): void {
    const sign = crypto.createSign('SHA256');
    sign.update(this.signData);
    this.signatures.set(publicKey, sign.sign(privateKey));
  }

  get hash(): string {
    const data = JSON.stringify({
      ...JSON.parse(this.signData),
      signatures: Array.from(this.signatures.entries())
    });
    return crypto.createHash('SHA256').update(data).digest('hex');
  }
}

// -------------------- Chain --------------------
class Chain {
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
}

// -------------------- Wallet --------------------
class Wallet {
  public readonly publicKey: string;
  public readonly privateKey: string;

  constructor() {
    const keypair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    this.publicKey = keypair.publicKey;
    this.privateKey = keypair.privateKey;
  }

  createVote(candidate: string): Vote {
    const vote = new Vote(this.publicKey, candidate);
    vote.sign(this.privateKey);
    return vote;
  }
}

// -------------------- Example Usage --------------------
// Initialize system
const voterRegistry = VoterRegistry.getInstance();

// Create participants
const electionCommission = new Wallet();
const validator1 = new Wallet();
const validator2 = new Wallet();
const validator3 = new Wallet();

// Configure chain
Chain.instance.validators.set(validator1.publicKey, true);
Chain.instance.validators.set(validator2.publicKey, true);
Chain.instance.validators.set(validator3.publicKey, true);

// Register voters
const alice = new Wallet();
const bob = new Wallet();
voterRegistry.registerVoter(alice.publicKey);
voterRegistry.registerVoter(bob.publicKey);

// Legitimate voting
const aliceVote = alice.createVote('Candidate A');
const block1 = new Block(Chain.instance.lastBlock.hash, aliceVote);
block1.addValidatorSignature(validator1.publicKey, validator1.privateKey);
block1.addValidatorSignature(validator2.publicKey, validator2.privateKey);
Chain.instance.addBlock(block1);

// Bob's vote
const bobVote = bob.createVote('Candidate B');
const block2 = new Block(Chain.instance.lastBlock.hash, bobVote);
block2.addValidatorSignature(validator2.publicKey, validator2.privateKey);
block2.addValidatorSignature(validator3.publicKey, validator3.privateKey);
Chain.instance.addBlock(block2);

// Attack attempts
const attacker = new Wallet();
const fakeVote = attacker.createVote('Candidate Hacker');
const badBlock = new Block(Chain.instance.lastBlock.hash, fakeVote);
badBlock.addValidatorSignature(validator1.publicKey, validator1.privateKey);
Chain.instance.addBlock(badBlock); // Should be rejected

// Double voting attempt
const aliceDuplicateVote = alice.createVote('Candidate A');
const duplicateBlock = new Block(Chain.instance.lastBlock.hash, aliceDuplicateVote);
duplicateBlock.addValidatorSignature(validator1.publicKey, validator1.privateKey);
duplicateBlock.addValidatorSignature(validator2.publicKey, validator2.privateKey);
Chain.instance.addBlock(duplicateBlock); // Should be rejected

console.log('Final chain:', Chain.instance.chain);