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
    
    // Crucial for browser compatibility: resume context if it starts suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    });
    const source = this.audioContext.createMediaStreamSource(this.stream);

    // Even lower buffer size for extreme snappiness (512 instead of 1024)
    this.processor = this.audioContext.createScriptProcessor(512, 1, 1);

    source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = this.floatTo16BitPCM(inputData);
      
      // Faster conversion to Base64
      let binary = '';
      const bytes = new Uint8Array(pcmData.buffer);
      for (let i = 0; i < bytes.length; i += 8192) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 8192)));
      }
      this.onAudioChunk(window.btoa(binary));
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
}
