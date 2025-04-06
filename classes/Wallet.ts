import * as crypto from 'crypto';
import Vote from "./Vote";

// -------------------- Wallet --------------------
export default class Wallet {
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

  createVote(candidate: string, position: string, department: string): Vote {
    const vote = new Vote(this.publicKey, candidate, position, department);
    vote.sign(this.privateKey);
    return vote;
  }
}
