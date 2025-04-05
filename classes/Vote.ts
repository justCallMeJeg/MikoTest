import * as crypto from 'crypto';

// -------------------- Vote --------------------
export default class Vote {
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
