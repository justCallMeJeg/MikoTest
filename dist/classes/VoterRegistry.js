"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.default = VoterRegistry;
