"use client"
import axios from 'axios'
import { useParams } from 'next/navigation'
import React, { useEffect, useState, useRef } from 'react'
// ตรวจสอบ path ให้ถูกต้องตามโครงสร้างโปรเจคของคุณ
import { docterAgent } from '../../_components/DocterAgentCard' 
import { Circle, PhoneCall, PhoneOff } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Vapi from '@vapi-ai/web';

// --- Types ---
type SessionDetail = {
  id: number,
  notes: string,
  sessionId: string,
  report: Record<string, any>, // JSON ไม่ใช่ type ที่ถูกต้องใน TS
  selectedDocter: docterAgent,
  createdOn: string,
}

type MessageItem = {
  role: string, // 'user' | 'assistant' | ...
  text: string
}

function MedicalVoiceAgent() {
  const { sessionId } = useParams()
  const [sessionDetail, setSessionDetail] = useState<SessionDetail>()
  const [callStarted, setCallStarted] = useState(false);
  const [vapiInstance, setVapiInstance] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null) // แก้ currentRoll เป็น currentRole
  const [liveTranscript, setLiveTranscript] = useState<string>("")
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [callDuration, setCallDuration] = useState(0);
  
  // Ref สำหรับเลื่อนหน้าจอแชท
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // 1. Fetch Session Data
  useEffect(() => {
    if (sessionId) GetSessionDetails()
  }, [sessionId])

  // 2. Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStarted) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callStarted]);

  // 3. Cleanup Vapi on Unmount (สำคัญมาก: ป้องกันเสียงค้างเมื่อเปลี่ยนหน้า)
  useEffect(() => {
    return () => {
      if (vapiInstance) {
        vapiInstance.stop();
        vapiInstance.removeAllListeners();
      }
    };
  }, [vapiInstance]);

  // 4. Auto Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveTranscript]);


  // --- Functions ---

  const GetSessionDetails = async () => {
    try {
      const result = await axios.get('/api/session-chat?sessionId=' + sessionId)
      setSessionDetail(result.data)
    } catch (error) {
      console.error("Error fetching session:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

const StartCall = () => {
    // 1. เช็คก่อนว่ามีข้อมูล Voice ID ไหม
    const voiceId = sessionDetail?.selectedDocter?.voiceId;

    if (!voiceId) {
      console.error("Voice ID is missing for this doctor:", sessionDetail?.selectedDocter);
      alert("ไม่พบข้อมูล Voice ID ของแพทย์ กรุณาตรวจสอบข้อมูล");
      return; 
    }

    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);
    setVapiInstance(vapi)

    const VapiAgentConfig = {
      name: 'AI Medical Doctor Voice Agent',
      firstMessage: 'สวัสดี, รบกวนช่วยบอกข้อมูลชื่อ นามสกุล และ อายุ ของท่านให้ฉันรู้หน่อยได้ไหม',
      transcriber: {
        provider: 'google',
        language: 'Thai' // หรือ 'th' ตามที่ google stt รองรับ
      },
      voice: {
        provider: 'azure',
        // 2. ส่งค่า voiceId ที่เราเช็คแล้วว่าเป็น string แน่นอน
        voiceId: voiceId 
      },
      model: {
        provider: 'google',
        model: 'gemini-2.0-flash',
        messages: [
          {
            role: 'system',
            content: sessionDetail?.selectedDocter?.agentPrompt || "You are a helpful medical assistant." // ใส่ fallback กัน prompt ว่าง
          }
        ]
      }
    }
    
    // Debug ดู config ก่อนส่ง (กด F12 ดูใน Console)
    console.log("Starting Vapi with Config:", VapiAgentConfig);

    try {
        //@ts-ignore
        vapi.start(VapiAgentConfig);
    } catch (err) {
        console.error("Vapi Start Error:", err);
    }

    // Event Listeners
    vapi.on('call-start', () => {
      console.log('Call started')
      setCallStarted(true);
    });

    vapi.on('call-end', () => {
      console.log('Call ended')
      setCallStarted(false);
      setCurrentRole(null);
      setLiveTranscript("");
    });

    vapi.on('message', (message: any) => {
      if (message.type === 'transcript') {
        const { role, transcriptType, transcript } = message
        
        if (transcriptType === 'partial') {
          setLiveTranscript(transcript);
          setCurrentRole(role);
        } else if (transcriptType === 'final') {
          setMessages((prev) => [...prev, { role: role, text: transcript }])
          setLiveTranscript("")
          setCurrentRole(null)
        }
      }
    });

    vapi.on('speech-start', () => {
      console.log('Assistant started speaking');
      setCurrentRole('assistant')
    });

    vapi.on('speech-end', () => {
      console.log('Assistant stopped speaking');
      setCurrentRole('user')
    });
    
    // Error handling
    vapi.on('error', (e:any) => {
        console.error("Vapi Runtime Error:", e); // ปรับ log ให้ชัดขึ้น
        setCallStarted(false);
    })
  }

  const endCall = () => {
    if (!vapiInstance) return;
    vapiInstance.stop();
    setCallStarted(false);
    // ไม่ต้อง setVapiInstance(null) ทันทีก็ได้ เพื่อให้ cleanup effect ทำงานได้ถูกต้องหากจำเป็น
  };

  // --- Render ---

  return (
    <div className='p-4 border rounded-3xl bg-secondary h-full min-h-[500px] flex flex-col'>
      {/* Header */}
      <div className='flex justify-between items-center p-3 rounded-xl'>
        <div className='flex gap-2 items-center'>
            <div className={`p-2 rounded-full transition-all ${callStarted ? 'bg-green-100' : 'bg-red-100'}`}>
                 <Circle className={`w-4 h-4 fill-current ${callStarted ? 'text-green-500 animate-pulse' : 'text-red-500'}`} />
            </div>
            <span className='font-medium text-sm'>{callStarted ? 'Connected...' : 'Disconnected'}</span>
        </div>
        <h2 className='text-xl font-mono font-bold text-primary'>{formatTime(callDuration)}</h2>
      </div>

      {sessionDetail && (
        <div className='flex flex-col items-center mt-6 flex-grow'>
          {/* Doctor Profile */}
          <div className='text-center mb-6'>
            <Image 
              src={sessionDetail?.selectedDocter?.image || '/placeholder-doctor.png'} 
              alt={sessionDetail?.selectedDocter.specialist ?? 'Doctor'}
              width={120}
              height={120}
              className='h-[100px] w-[100px] object-cover rounded-full border-4 border-background shadow-md mx-auto' 
            />
            <h2 className='mt-3 text-lg font-bold'>{sessionDetail?.selectedDocter?.specialist}</h2>
            <p className='text-sm text-muted-foreground'>AI Medical Voice Agent</p>
          </div>

          {/* Chat / Transcript Area */}
          <div className='w-full max-h-[350px] overflow-y-auto p-4 bg-background rounded-xl border shadow-inner flex flex-col gap-3'>
            {messages.length === 0 && !liveTranscript && (
                 <p className='text-center text-muted-foreground text-sm italic py-10'>Start the call to begin consultation...</p>
            )}

            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-none' 
                    : 'bg-muted text-foreground rounded-tl-none'
                }`}>
                    {msg.text}
                </div>
              </div>
            ))}

            {/* Live Transcript Bubble */}
            {liveTranscript && (
               <div className={`flex ${currentRole === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm opacity-70 animate-pulse ${
                    currentRole === 'user' 
                    ? 'bg-primary/50 text-primary-foreground rounded-tr-none' 
                    : 'bg-muted/50 text-foreground rounded-tl-none'
                }`}>
                    {liveTranscript}...
                </div>
              </div>
            )}
            
            {/* Invisible div for auto-scrolling */}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className='mt-6 w-full flex justify-center'>
            {!callStarted ? (
              <Button className='w-full max-w-xs h-12 text-lg shadow-lg' onClick={StartCall}>
                <PhoneCall className='mr-2 w-5 h-5' /> Start Consultation
              </Button>
            ) : (
              <Button variant={'destructive'} className='w-full max-w-xs h-12 text-lg shadow-lg' onClick={endCall}>
                <PhoneOff className='mr-2 w-5 h-5' /> End Call
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MedicalVoiceAgent