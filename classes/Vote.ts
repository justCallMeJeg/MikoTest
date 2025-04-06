// -------------------- Vote.ts --------------------
import * as crypto from 'crypto';

export default class Vote {
  public signature: Buffer | undefined;

  constructor(
    public readonly voterPublicKey: string,
    public readonly candidate: string,
    public readonly position: string,  // Added position
    public readonly department: string, // Added department
    public readonly timestamp: number = Date.now()
  ) {}

  toString(): string {
    return JSON.stringify({
      voterPublicKey: this.voterPublicKey,
      candidate: this.candidate,
      position: this.position,
      department: this.department,
      timestamp: this.timestamp
    });
  }

  sign(privateKey: string): void {
    const sign = crypto.createSign('SHA256');
    sign.update(this.toString());
    this.signature = sign.sign(privateKey);
  }
}