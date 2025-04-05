import * as crypto from 'crypto';
import Vote from "./Vote";

// -------------------- Block --------------------
export default class Block {
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
