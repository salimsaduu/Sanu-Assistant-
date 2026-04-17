/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Power, Globe, Sparkles, Loader2, Youtube, Instagram, Linkedin, Send } from 'lucide-react';
import { AudioRecorder } from './lib/AudioRecorder';
import { AudioPlayer } from './lib/AudioPlayer';
import { GeminiLiveManager } from './lib/gemini';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type InteractionState = 'idle' | 'listening' | 'thinking' | 'speaking';

export default function App() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [interactionState, setInteractionState] = useState<InteractionState>('idle');
  const [error, setError] = useState<string | null>(null);

  const managerRef = useRef<GeminiLiveManager | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);

  const toggleConnection = async () => {
    if (status === 'connected' || status === 'connecting') {
      disconnect();
    } else {
      await connect();
    }
  };

  const connect = async () => {
    try {
      setStatus('connecting');
      setError(null);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is missing');
      }

      const manager = new GeminiLiveManager(apiKey);
      managerRef.current = manager;
      playerRef.current = new AudioPlayer();

      await manager.connect({
        onOpen: () => {
          setStatus('connected');
          setInteractionState('listening');
          startRecording();
        },
        onClose: () => {
          disconnect();
        },
        onError: (err) => {
          console.error('Gemini Error:', err);
          setError('Saniya is resting right now. Try again?');
          disconnect();
        },
        onAudioOutput: (base64) => {
          setInteractionState('speaking');
          playerRef.current?.playChunk(base64);
        },
        onInterruption: () => {
          playerRef.current?.stopAll();
          setInteractionState('listening');
        },
        onToolCall: (toolCall) => {
          handleToolCall(toolCall);
        }
      });

    } catch (err: any) {
      console.error('Connection failed:', err);
      setError('Connection failed. Saniya needs a moment.');
      setStatus('error');
    }
  };

  const disconnect = () => {
    stopRecording();
    managerRef.current?.disconnect();
    playerRef.current?.stopAll();
    managerRef.current = null;
    playerRef.current = null;
    setStatus('disconnected');
    setInteractionState('idle');
  };

  const startRecording = () => {
    if (!recorderRef.current) {
      recorderRef.current = new AudioRecorder((base64) => {
        managerRef.current?.sendAudio(base64);
      });
    }
    recorderRef.current.start().catch((err) => {
      console.error('Mic error:', err);
      setError('Mic access denied. I can\'t hear you, babe!');
      disconnect();
    });
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
  };

  const handleToolCall = useCallback((toolCall: any) => {
    setInteractionState('thinking');
    const calls = toolCall.functionCalls;
    if (!calls) return;

    const results = calls.map((call: any) => {
      const { name, args, id } = call;
      console.log(`Executing tool: ${name}`, args);

      if (name === 'openWebsite') {
        window.open(args.url, '_blank');
        return { name, id, response: { success: true, message: `Navigated to ${args.url}` } };
      }
      
      if (name === 'makeCall') {
        window.open(`tel:${args.phoneNumber}`, '_self');
        return { name, id, response: { success: true, message: `Calling ${args.phoneNumber}` } };
      }

      if (name === 'setAlarm') {
        // Simulation: Just show a message
        setError(`Alarm set for ${args.time}!`);
        setTimeout(() => setError(null), 5000);
        return { name, id, response: { success: true, message: `Alarm set for ${args.time}` } };
      }

      if (name === 'openMedia') {
        // Simulation: Open a placeholder or just acknowledge
        window.open('https://picsum.photos/800/600', '_blank');
        return { name, id, response: { success: true, message: `Opening ${args.type} gallery` } };
      }

      if (name === 'manageDevice') {
        setError(`Device action triggered: ${args.action}`);
        setTimeout(() => setError(null), 5000);
        return { name, id, response: { success: true, message: `Simulated ${args.action} triggered.` } };
      }

      return { name, id, response: { error: 'Unknown tool' } };
    });

    managerRef.current?.sendToolResponse(results);
  }, []);

  useEffect(() => {
    if (interactionState === 'speaking') {
      const timer = setTimeout(() => {
        setInteractionState('listening');
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [interactionState]);

  const [bannerIndex, setBannerIndex] = useState(0);
  const banners = [
    { 
      id: 1, 
      title: "Youtube", 
      subtitle: "Channel Salim Aatish", 
      contact: "+123-456-7890",
      address: "123 Anywhere St., Any City",
      cta: "Contact Us", 
      color: "from-[#0a0a0f] to-[#121218]", 
      accentColor: "#FF0000",
      image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2069&auto=format&fit=crop",
      icon: Youtube 
    },
    { 
      id: 2, 
      title: "Instagram", 
      subtitle: "@salimaatish Official", 
      contact: "+123-456-7890",
      address: "Modern Design Studio",
      cta: "Follow Me", 
      color: "from-[#0a0a0f] to-[#1a1a24]", 
      accentColor: "#ee2a7b",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop",
      icon: Instagram 
    },
    { 
      id: 3, 
      title: "LinkedIn", 
      subtitle: "Professional Network", 
      contact: "Connect Today",
      address: "Global Business Hub",
      cta: "Network", 
      color: "from-[#0a0a0f] to-[#121a24]", 
      accentColor: "#0077b5",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop",
      icon: Linkedin 
    },
    { 
      id: 4, 
      title: "Telegram", 
      subtitle: "Exclusive Community", 
      contact: "Join the Squad",
      address: "Secure Dev Network",
      cta: "Join Now", 
      color: "from-[#0a0a0f] to-[#121a24]", 
      accentColor: "#229ED9",
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop",
      icon: Send 
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#4A2C2A] flex flex-col items-center justify-between p-6 relative overflow-hidden font-sans">
      {/* Luxury Atmospheric Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#FCE7F3]/40 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#FDE2E4]/40 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-20" />
      </div>

      <header className="z-10 w-full flex justify-between items-center bg-white/60 p-5 rounded-[2rem] backdrop-blur-3xl border border-white/80 shadow-[0_10px_40px_-15px_rgba(74,44,42,0.1)]">
        <div className="flex flex-col">
          <motion.h1 
            className="text-4xl font-black tracking-tighter text-[#E91E63]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            SANIYA <span className="text-white text-[10px] font-bold tracking-[0.2em] bg-[#D4AF37] px-3 py-1 rounded-full ml-3 shadow-lg">GOLD</span>
          </motion.h1>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2.5 h-2.5 rounded-full ${status === 'connected' ? 'bg-[#4CAF50] shadow-[0_0_15px_#4CAF50]' : 'bg-gray-300'}`} />
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#8e8271] font-bold">
              {status === 'connected' ? 'Luxury Stream Active' : 'Waiting for Master'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-[9px] uppercase tracking-[0.5em] text-[#D4AF37] font-black mb-1">Chief Architect</span>
          <motion.div 
            className="px-6 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white rounded-xl text-[11px] uppercase tracking-widest font-black shadow-xl"
            whileHover={{ scale: 1.05 }}
          >
            Salim Aatish
          </motion.div>
        </div>
      </header>

      {/* Saniya Avatar Section */}
      <motion.div 
        className="z-10 w-full max-w-sm mb-6 overflow-hidden rounded-[2.5rem] border-8 border-white shadow-2xl relative group"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <img 
          src="https://images.unsplash.com/photo-1574701148212-8518049c7b2c?q=80&w=1972&auto=format&fit=crop" 
          alt="Saniya AI" 
          className="w-full aspect-[3/4] object-cover transition-transform group-hover:scale-105 duration-[2000ms]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
           <div className="flex flex-col gap-1">
              <span className="text-white text-lg font-black uppercase tracking-[0.2em] drop-shadow-lg">SANIYA G.</span>
              <span className="text-pink-300 text-[10px] font-bold tracking-widest uppercase bg-black/40 backdrop-blur-md px-3 py-1 rounded-full w-fit">Virtual Companion</span>
           </div>
        </div>
        {status === 'connected' && (
          <motion.div 
            className="absolute top-6 right-6 w-4 h-4 bg-green-500 rounded-full border-4 border-white shadow-[0_0_20px_rgba(34,197,94,0.8)]"
            animate={{ opacity: [1, 0, 1], scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.div>

      <main className="z-10 flex flex-col items-center justify-center flex-1 w-full relative">
        {/* The Luxury Core */}
        <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
          <AnimatePresence mode="wait">
            {status === 'connected' ? (
              <motion.div
                key="active-orb"
                className="relative flex items-center justify-center w-full h-full"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
              >
                <motion.div 
                  className="relative w-48 h-48 rounded-full z-20 overflow-hidden cursor-pointer shadow-2xl border-4 border-white ring-4 ring-[#FDE2E4]"
                  onClick={toggleConnection}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FFC1CC] via-[#E91E63] to-[#C2185B]" />
                  <motion.div 
                    className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%]"
                    animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <AnimatePresence mode="wait">
                      {interactionState === 'speaking' ? (
                        <motion.div key="speak" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ opacity: 0 }}>
                           <Sparkles className="w-16 h-16 drop-shadow-2xl" />
                        </motion.div>
                      ) : interactionState === 'thinking' ? (
                        <motion.div key="think" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
                           <Loader2 className="w-16 h-16" />
                        </motion.div>
                      ) : (
                        <motion.div key="listen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <Mic className="w-16 h-16" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="ready-state"
                className="flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div onClick={toggleConnection} className="w-40 h-40 rounded-3xl bg-white border border-[#D4AF37]/10 flex items-center justify-center cursor-pointer shadow-xl hover:shadow-[#D4AF37]/20 transition-all">
                  <Power className="w-16 h-16 text-[#D4AF37]/40" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Promotional Advertising Banners - Exact Ad Style Request */}
        <div className="z-10 w-full max-w-[450px] mt-10 min-h-[220px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {(() => {
                const BannerIcon = banners[bannerIndex].icon;
                const banner = banners[bannerIndex];
                return (
                  <motion.div
                    key={bannerIndex}
                    className={`w-full aspect-[2/1] bg-gradient-to-br ${banner.color} rounded-[2rem] shadow-2xl border border-white/10 flex overflow-hidden relative group/ad`}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.05, y: -10 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Left Content Side */}
                    <div className="flex-[1.2] p-6 flex flex-col justify-between relative z-10">
                      <div>
                        {/* Contact Us Badge */}
                        <div className="border border-white/20 rounded-full px-4 py-1.5 w-fit mb-6 backdrop-blur-sm group-hover/ad:border-white transition-colors">
                           <span className="text-white text-[10px] font-medium tracking-widest uppercase">{banner.cta}</span>
                        </div>
                        
                        {/* Main Typography */}
                        <div className="flex flex-col">
                           <h3 
                            className="text-[28px] font-black uppercase leading-[0.9] tracking-tighter"
                            style={{ color: banner.accentColor }}
                           >
                            {banner.title}
                           </h3>
                           <h4 className="text-[24px] font-black uppercase text-white leading-tight tracking-tighter">
                            {banner.subtitle}
                           </h4>
                        </div>
                      </div>

                      {/* Contact Info Footer */}
                      <div className="space-y-3 pt-4 border-t border-white/5">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover/ad:scale-110" style={{ backgroundColor: banner.accentColor }}>
                               <BannerIcon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-[11px] font-bold text-white/80">{banner.contact}</span>
                         </div>
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover/ad:scale-110" style={{ backgroundColor: banner.accentColor }}>
                               <Globe className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-[11px] font-bold text-white/80 truncate">{banner.address}</span>
                         </div>
                      </div>
                    </div>

                    {/* Middle Abstract Shape (The Arrow/Shape from the reference) */}
                    <div className="absolute right-[33%] top-0 bottom-0 z-20 w-32 pointer-events-none">
                       <svg viewBox="0 0 100 200" className="h-full w-full fill-current" style={{ color: banner.accentColor }}>
                          <path d="M0,0 L70,0 C85,50 85,150 70,200 L0,200 C30,150 30,50 0,0" />
                       </svg>
                    </div>

                    {/* Right Image Side */}
                    <div className="flex-1 relative overflow-hidden">
                       <img 
                        src={banner.image} 
                        alt="Ad Action" 
                        className="w-full h-full object-cover grayscale-[0.2] transition-transform duration-700 group-hover/ad:scale-110"
                        referrerPolicy="no-referrer"
                       />
                       <div className="absolute inset-0 bg-gradient-to-l from-black/40 to-transparent" />
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
        </div>
      </main>


      <footer className="z-10 w-full flex flex-col items-center gap-4 pt-4">
        <div className="px-6 py-2 bg-white/80 rounded-full border border-[#FDE2E4] shadow-md backdrop-blur-md">
          <AnimatePresence mode="wait">
            <motion.p
              key={interactionState + status}
              className="text-[10px] tracking-[0.2em] text-[#E91E63] font-black uppercase text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {status === 'connecting' && "Waking her up..."}
              {status === 'connected' && interactionState === 'listening' && "Talk to her..."}
              {status === 'connected' && interactionState === 'speaking' && "Saniya's sweet voice..."}
              {status === 'connected' && interactionState === 'thinking' && "Contemplating..."}
              {status === 'error' && <span className="text-[#C2185B]">{error}</span>}
              {!status || status === 'disconnected' && "Ready to start session"}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-12">
           <button
            onClick={toggleConnection}
            disabled={status === 'connecting'}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative
              ${status === 'connected' 
                ? 'bg-[#4A2C2A] text-white' 
                : 'bg-[#E91E63] text-white'}
            `}
          >
            {status === 'connected' ? (
              <Power className="w-8 h-8" />
            ) : status === 'connecting' ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>
        </div>
        
        <div className="flex flex-col items-center gap-1 opacity-50">
            <span className="text-[7px] uppercase tracking-[0.8em] text-[#A68966] font-black italic">The Salim Aatish Experience</span>
        </div>
      </footer>
    </div>
  );
}





