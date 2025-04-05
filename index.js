"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
// -------------------- Voter Registry --------------------
class VoterRegistry {
    constructor() {
        this.allowedVoters = new Set();
    }
    static getInstance() {
        if (!VoterRegistry.instance) {
            VoterRegistry.instance = new VoterRegistry();
        }
        return VoterRegistry.instance;
    }
    registerVoter(publicKey) {
        this.allowedVoters.add(publicKey);
    }
    isVoterValid(publicKey) {
        return this.allowedVoters.has(publicKey);
    }
}
// -------------------- Vote --------------------
class Vote {
    constructor(voterPublicKey, candidate, timestamp = Date.now()) {
        this.voterPublicKey = voterPublicKey;
        this.candidate = candidate;
        this.timestamp = timestamp;
    }
    toString() {
        return JSON.stringify({
            voterPublicKey: this.voterPublicKey,
            candidate: this.candidate,
            timestamp: this.timestamp
        });
    }
    sign(privateKey) {
        const sign = crypto.createSign('SHA256');
        sign.update(this.toString());
        this.signature = sign.sign(privateKey);
    }
}
// -------------------- Block --------------------
class Block {
    constructor(previousHash, vote, timestamp = Date.now()) {
        this.previousHash = previousHash;
        this.vote = vote;
        this.timestamp = timestamp;
        this.signatures = new Map();
    }
    get signData() {
        return JSON.stringify({
            previousHash: this.previousHash,
            vote: this.vote.toString(),
            timestamp: this.timestamp
        });
    }
    addValidatorSignature(publicKey, privateKey) {
        const sign = crypto.createSign('SHA256');
        sign.update(this.signData);
        this.signatures.set(publicKey, sign.sign(privateKey));
    }
    get hash() {
        const data = JSON.stringify(Object.assign(Object.assign({}, JSON.parse(this.signData)), { signatures: Array.from(this.signatures.entries()) }));
        return crypto.createHash('SHA256').update(data).digest('hex');
    }
}
// -------------------- Chain --------------------
class Chain {
    constructor() {
        this.validators = new Map();
        this.REQUIRED_SIGNATURES = 2;
        this.MAX_VOTE_AGE_MS = 300000; // 5 minutes
        this.chain = [this.createGenesisBlock()];
    }
    createGenesisBlock() {
        const genesisVote = new Vote('system', 'genesis', 0);
        const genesisBlock = new Block('', genesisVote);
        this.validators.set('genesis-validator', true); // Special genesis validator
        return genesisBlock;
    }
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    addBlock(block) {
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
    tallyVotes() {
        const tally = {};
        // Skip genesis block
        for (let i = 1; i < this.chain.length; i++) {
            const candidate = this.chain[i].vote.candidate;
            tally[candidate] = (tally[candidate] || 0) + 1;
        }
        return tally;
    }
    displayResults() {
        const tally = this.tallyVotes();
        console.log('\nElection Results:');
        console.log('-----------------');
        for (const [candidate, votes] of Object.entries(tally)) {
            console.log(`${candidate}: ${votes} vote${votes !== 1 ? 's' : ''}`);
        }
        console.log('-----------------');
    }
}
Chain.instance = new Chain();
// -------------------- Wallet --------------------
class Wallet {
    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        this.publicKey = keypair.publicKey;
        this.privateKey = keypair.privateKey;
    }
    createVote(candidate) {
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
// After adding blocks
console.log('\nFinal Chain:');
Chain.instance.displayResults();
// Add more votes to test tally
const charlie = new Wallet();
voterRegistry.registerVoter(charlie.publicKey);
const charlieVote = charlie.createVote('Candidate A');
const block3 = new Block(Chain.instance.lastBlock.hash, charlieVote);
block3.addValidatorSignature(validator1.publicKey, validator1.privateKey);
block3.addValidatorSignature(validator3.publicKey, validator3.privateKey);
Chain.instance.addBlock(block3);
console.log('\nAfter Additional Vote:');
Chain.instance.displayResults();
