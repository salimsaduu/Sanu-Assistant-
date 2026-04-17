/**
 * Utility to play raw PCM 16-bit 24kHz audio chunks.
 */
export class AudioPlayer {
  private audioContext: AudioContext;
  private nextStartTime: number = 0;
  private sampleRate: number = 24000;

  constructor() {
    this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
  }

  async playChunk(base64Data: string) {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    const binary = window.atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 32768.0;
    }

    const audioBuffer = this.audioContext.createBuffer(1, floatData.length, this.sampleRate);
    audioBuffer.getChannelData(0).set(floatData);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    const startTime = Math.max(this.audioContext.currentTime, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + audioBuffer.duration;
  }

  stopAll() {
    // There's no easy way to stop all scheduled buffers on a single context
    // without closing it or tracking all sources. For simplicity:
    this.audioContext.close();
    this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
    this.nextStartTime = 0;
  }

  get context() {
    return this.audioContext;
  }
}
