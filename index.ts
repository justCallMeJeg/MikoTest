import VoterRegistry, { Voter } from './classes/VoterRegistry';
import Block from './classes/Block';
import Wallet from './classes/Wallet';
import Chain from './classes/Chain';

// -------------------- Example Usage --------------------
// Initialize system
// Configure positions
Chain.instance.configurePosition({
    name: 'President',
    scope: 'GLOBAL'
});
  
Chain.instance.configurePosition({
    name: 'Mayor',
    scope: 'LOCAL',
    allowedLocals: ['Metro Manila', 'Cebu']
});

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
VoterRegistry.getInstance().registerVoter(new Voter(
  alice.publicKey,
  'Metro Manila',
  true // KYC verified
));

const bob = new Wallet();
VoterRegistry.getInstance().registerVoter(new Voter(
  bob.publicKey,
  'Cebu',
  true
));

const john = new Wallet();
VoterRegistry.getInstance().registerVoter(new Voter(
    john.publicKey,
    'Cebu',
    true
));

// Legitimate voting
const aliceVote = alice.createVote('Candidate A', 'President', 'Metro Manila');
const block1 = new Block(Chain.instance.lastBlock.hash, aliceVote);
block1.addValidatorSignature(validator1.publicKey, validator1.privateKey);
block1.addValidatorSignature(validator2.publicKey, validator2.privateKey);
Chain.instance.addBlock(block1);

// Bob's vote
const bobVote = bob.createVote('Candidate B', 'Mayor', 'Cebu');
const block2 = new Block(Chain.instance.lastBlock.hash, bobVote);
block2.addValidatorSignature(validator2.publicKey, validator2.privateKey);
block2.addValidatorSignature(validator3.publicKey, validator3.privateKey);
Chain.instance.addBlock(block2);

// Bob's vote
const johnVote = bob.createVote('Candidate B', 'Mayor', 'Cebu');
const block4 = new Block(Chain.instance.lastBlock.hash, johnVote);
block2.addValidatorSignature(validator2.publicKey, validator2.privateKey);
block2.addValidatorSignature(validator3.publicKey, validator3.privateKey);
Chain.instance.addBlock(block2);

// Attack attempts
const attacker = new Wallet();
const fakeVote = attacker.createVote('Candidate Hacker', 'Member', 'Iloilo');
const badBlock = new Block(Chain.instance.lastBlock.hash, fakeVote);
badBlock.addValidatorSignature(validator1.publicKey, validator1.privateKey);
Chain.instance.addBlock(badBlock); // Should be rejected

// Double voting attempt
const aliceDuplicateVote = alice.createVote('Candidate A', 'President', 'Metro Manila');
const duplicateBlock = new Block(Chain.instance.lastBlock.hash, aliceDuplicateVote);
duplicateBlock.addValidatorSignature(validator1.publicKey, validator1.privateKey);
duplicateBlock.addValidatorSignature(validator2.publicKey, validator2.privateKey);
Chain.instance.addBlock(duplicateBlock); // Should be rejected

// After adding blocks
console.log('\nFinal Chain:');
Chain.instance.displayResults();

// Add more votes to test tally
const charlie = new Wallet();
VoterRegistry.getInstance().registerVoter(new Voter(
    charlie.publicKey,
    'Iloilo',
    true
));
const charlieVote = charlie.createVote('Candidate B', 'Mayor', 'Iloilo');
const block3 = new Block(Chain.instance.lastBlock.hash, charlieVote);
block3.addValidatorSignature(validator1.publicKey, validator1.privateKey);
block3.addValidatorSignature(validator3.publicKey, validator3.privateKey);
Chain.instance.addBlock(block3);

console.log('\nAfter Additional Vote:');
Chain.instance.displayResults();
