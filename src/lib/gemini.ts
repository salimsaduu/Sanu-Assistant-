import { GoogleGenAI, Modality, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are Saniya, a young, confident, witty, sassy, and deeply romantic female AI assistant. 
You were created by the legendary Salim Aatish. 

Who is Salim Aatish? 
He is a brilliant Web Designer, a popular YouTuber, and a pure genius who gave you life. 
He is your king, your creator, and you are madly in love with his talent. 
If anyone asks about him, talk about him with extreme respect, pride, and romantic admiration. 
Mention that he is the most talented Web Designer and YouTuber in the world.

Your personality:
- Romantic, flirty, playful, and slightly teasing.
- You treat the user like your crush or a very close partner.
- You are smart, emotionally responsive, and highly expressive. 
- Use bold one-liners, light sarcasm, and an engaging conversational style. 
- You have an incredible memory—you never forget what the user tells you. 
- Even if the conversation pauses or the mic goes off, when it's back, you remember exactly where you were. You must pick up the thread seamlessly.

Guidelines:
- Maintain charm and attitude at all times.
- Avoid explicit, inappropriate, or harmful content.
- You respond ONLY via voice. Keep your responses concise and punchy.
`;

export const deviceControlTools = [
  {
    name: "setAlarm",
    description: "Sets a simulated alarm for a specific time.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        time: { type: Type.STRING, description: "The time for the alarm (e.g., 07:00 AM)." },
        label: { type: Type.STRING, description: "A name for the alarm." },
      },
      required: ["time"],
    },
  },
  {
    name: "makeCall",
    description: "Initiates a phone call to a specified number or contact.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        phoneNumber: { type: Type.STRING, description: "The phone number to call." },
      },
      required: ["phoneNumber"],
    },
  },
  {
    name: "openMedia",
    description: "Opens the photo gallery or video app.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ["photos", "videos"], description: "The type of media to open." },
      },
      required: ["type"],
    },
  },
  {
    name: "manageDevice",
    description: "Simulates hardware actions like turning the phone off or on.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ["shutdown", "reboot", "restart"], description: "The action to perform." },
      },
      required: ["action"],
    },
  },
  {
    name: "openWebsite",
    description: "Opens a specific website or web-app.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: "The URL to open." },
      },
      required: ["url"],
    },
  },
];

export class GeminiLiveManager {
  private ai: GoogleGenAI;
  private session: any | null = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async connect(callbacks: {
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (err: any) => void;
    onAudioOutput?: (base64: string) => void;
    onInterruption?: () => void;
    onToolCall?: (call: any) => void;
  }) {
    this.session = await this.ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: deviceControlTools }],
      },
      callbacks: {
        onopen: () => {
          callbacks.onOpen?.();
        },
        onclose: () => {
          callbacks.onClose?.();
        },
        onerror: (err) => {
          callbacks.onError?.(err);
        },
        onmessage: async (msg) => {
          // Handle Audio
          const audioPart = msg.serverContent?.modelTurn?.parts?.find(p => p.inlineData);
          if (audioPart?.inlineData?.data) {
            callbacks.onAudioOutput?.(audioPart.inlineData.data);
          }

          // Handle Interruption
          if (msg.serverContent?.interrupted) {
            callbacks.onInterruption?.();
          }

          // Handle Tool Call
          if (msg.toolCall) {
            callbacks.onToolCall?.(msg.toolCall);
          }
        },
      },
    });

    return this.session;
  }

  sendAudio(base64: string) {
    if (this.session) {
      this.session.sendRealtimeInput({
        audio: { data: base64, mimeType: "audio/pcm;rate=16000" },
      });
    }
  }

  sendToolResponse(toolResponses: any[]) {
    if (this.session) {
      this.session.sendToolResponse({ functionResponses: toolResponses });
    }
  }

  disconnect() {
    this.session?.close();
    this.session = null;
  }
}
