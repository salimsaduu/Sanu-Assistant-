/**
 * Utility to record audio and convert it to PCM 16-bit 16kHz chunks.
 */
export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private onAudioChunk: (base64Data: string) => void;

  constructor(onAudioChunk: (base64Data: string) => void) {
    this.onAudioChunk = onAudioChunk;
  }

  async start() {
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = this.audioContext.createMediaStreamSource(this.stream);

    // ScriptProcessor is deprecated but widely supported for simple PCM extraction in this context.
    // In a production app, AudioWorklet would be better, but ScriptProcessor is more straightforward here.
    this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);

    source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = this.floatTo16BitPCM(inputData);
      const base64Data = this.arrayBufferToBase64(pcmData.buffer);
      this.onAudioChunk(base64Data);
    };
  }

  stop() {
    this.processor?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.audioContext?.close();
    this.processor = null;
    this.stream = null;
    this.audioContext = null;
  }

  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
