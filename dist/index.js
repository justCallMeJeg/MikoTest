"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const VoterRegistry_1 = __importDefault(require("./classes/VoterRegistry"));
const Block_1 = __importDefault(require("./classes/Block"));
const Wallet_1 = __importDefault(require("./classes/Wallet"));
const Chain_1 = __importDefault(require("./classes/Chain"));
// -------------------- Example Usage --------------------
// Initialize system
const voterRegistry = VoterRegistry_1.default.getInstance();
// Create participants
const electionCommission = new Wallet_1.default();
const validator1 = new Wallet_1.default();
const validator2 = new Wallet_1.default();
const validator3 = new Wallet_1.default();
// Configure chain
Chain_1.default.instance.validators.set(validator1.publicKey, true);
Chain_1.default.instance.validators.set(validator2.publicKey, true);
Chain_1.default.instance.validators.set(validator3.publicKey, true);
// Register voters
const alice = new Wallet_1.default();
const bob = new Wallet_1.default();
voterRegistry.registerVoter(alice.publicKey);
voterRegistry.registerVoter(bob.publicKey);
// Legitimate voting
const aliceVote = alice.createVote('Candidate A');
const block1 = new Block_1.default(Chain_1.default.instance.lastBlock.hash, aliceVote);
block1.addValidatorSignature(validator1.publicKey, validator1.privateKey);
block1.addValidatorSignature(validator2.publicKey, validator2.privateKey);
Chain_1.default.instance.addBlock(block1);
// Bob's vote
const bobVote = bob.createVote('Candidate B');
const block2 = new Block_1.default(Chain_1.default.instance.lastBlock.hash, bobVote);
block2.addValidatorSignature(validator2.publicKey, validator2.privateKey);
block2.addValidatorSignature(validator3.publicKey, validator3.privateKey);
Chain_1.default.instance.addBlock(block2);
// Attack attempts
const attacker = new Wallet_1.default();
const fakeVote = attacker.createVote('Candidate Hacker');
const badBlock = new Block_1.default(Chain_1.default.instance.lastBlock.hash, fakeVote);
badBlock.addValidatorSignature(validator1.publicKey, validator1.privateKey);
Chain_1.default.instance.addBlock(badBlock); // Should be rejected
// Double voting attempt
const aliceDuplicateVote = alice.createVote('Candidate A');
const duplicateBlock = new Block_1.default(Chain_1.default.instance.lastBlock.hash, aliceDuplicateVote);
duplicateBlock.addValidatorSignature(validator1.publicKey, validator1.privateKey);
duplicateBlock.addValidatorSignature(validator2.publicKey, validator2.privateKey);
Chain_1.default.instance.addBlock(duplicateBlock); // Should be rejected
// After adding blocks
console.log('\nFinal Chain:');
Chain_1.default.instance.displayResults();
// Add more votes to test tally
const charlie = new Wallet_1.default();
voterRegistry.registerVoter(charlie.publicKey);
const charlieVote = charlie.createVote('Candidate A');
const block3 = new Block_1.default(Chain_1.default.instance.lastBlock.hash, charlieVote);
block3.addValidatorSignature(validator1.publicKey, validator1.privateKey);
block3.addValidatorSignature(validator3.publicKey, validator3.privateKey);
Chain_1.default.instance.addBlock(block3);
console.log('\nAfter Additional Vote:');
Chain_1.default.instance.displayResults();
