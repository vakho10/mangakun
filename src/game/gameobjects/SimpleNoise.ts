export class SimpleNoise {
  private values: number[] = [];
  private size: number;

  constructor(size = 256) {
    this.size = size;
    for (let i = 0; i < size; i++) {
      this.values[i] = Math.random();
    }
  }

  private lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  get(x: number) {
    const i = Math.floor(x * this.size) % this.size;
    const j = (i + 1) % this.size;
    const t = (x * this.size) % 1;
    return this.lerp(this.values[i], this.values[j], t);
  }
}
