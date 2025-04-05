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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
const Block_1 = __importDefault(require("./Block"));
const Vote_1 = __importDefault(require("./Vote"));
const VoterRegistry_1 = __importDefault(require("./VoterRegistry"));
// -------------------- Chain --------------------
class Chain {
    constructor() {
        this.validators = new Map();
        this.REQUIRED_SIGNATURES = 2;
        this.MAX_VOTE_AGE_MS = 300000; // 5 minutes
        this.chain = [this.createGenesisBlock()];
    }
    createGenesisBlock() {
        const genesisVote = new Vote_1.default('system', 'genesis', 0);
        const genesisBlock = new Block_1.default('', genesisVote);
        this.validators.set('genesis-validator', true); // Special genesis validator
        return genesisBlock;
    }
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    addBlock(block) {
        // Voter validation
        if (!VoterRegistry_1.default.getInstance().isVoterValid(block.vote.voterPublicKey)) {
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
exports.default = Chain;
