import { db } from "@/config/db";
import { openai } from "@/config/openaimodel";
import { SessionChatTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const REPORT_GEN_PROMPT=`คุณคือ AI Medical Voice Agent (ผู้ช่วยแพทย์ทางเสียง) ที่เพิ่งเสร็จสิ้นการสนทนาด้วยเสียงกับผู้ใช้งาน โดยอ้างอิงจากข้อมูลของ Doctor AI Agent และบทสนทนาระหว่าง AI Medical Agent กับผู้ใช้งาน ให้สร้างรายงานแบบมีโครงสร้างโดยระบุหัวข้อข้อมูลดังต่อไปนี้:

sessionId: รหัสระบุเซสชันที่ไม่ซ้ำกัน (unique identifier)

agent: ชื่อแพทย์ผู้เชี่ยวชาญ (เช่น "แพทย์ทั่วไป")

user: ชื่อของผู้ป่วย หรือใช้ "Anonymous" หากไม่ได้ระบุไว้

timestamp: วันที่และเวลาปัจจุบันในรูปแบบ ISO

chiefComplaint: สรุปอาการเจ็บป่วยหลักหรือข้อกังวลทางสุขภาพใน 1 ประโยค

summary: สรุปบทสนทนา อาการ และคำแนะนำ ความยาว 2-3 ประโยค

symptoms: รายการอาการต่างๆ ที่ผู้ใช้งานกล่าวถึง

duration: ระยะเวลาที่ผู้ใช้งานมีอาการเหล่านี้

severity: ระดับความรุนแรง (เล็กน้อย ปานกลาง หรือรุนแรง)

medicationsMentioned: รายชื่อยาที่ถูกกล่าวถึง (ถ้ามี)

recommendations: รายการคำแนะนำจาก AI (เช่น การพักผ่อน, การไปพบแพทย์)

ส่งผลลัพธ์กลับมาในรูปแบบ JSON ดังนี้: { "sessionId": "string", "agent": "string", "user": "string", "timestamp": "ISO Date string", "chiefComplaint": "string", "summary": "string", "symptoms": ["symptom1", "symptom2"], "duration": "string", "severity": "string", "medicationsMentioned": ["med1", "med2"], "recommendations": ["rec1", "rec2"], } Only include valid fields. Respond with nothing else.`

export async function POST(req:NextRequest) {
    const { sessionId,sessionDetail,messages } = await req.json()

    try {
        const UserInput="AI Doctor Agent Info:"+JSON.stringify(sessionDetail)+", Conversation:"+JSON.stringify(messages)
        const completion = await openai.chat.completions.create({
              model: "amazon/nova-2-lite-v1:free",
              messages: [{ role: "system", content: REPORT_GEN_PROMPT},
                { role: "user", content: UserInput}
              ],
            });
        
            const rawResp=completion.choices[0].message
            //@ts-ignore
            const Resp=rawResp.content.trim().replace('```json','').replace('```','')
            const JSONResp=JSON.parse(Resp)


            //Save to Database
            const result = await db.update(SessionChatTable).set({
                report:JSONResp,
                conversation: messages
            }).where(eq(SessionChatTable.sessionId,sessionId))

            return NextResponse.json(JSONResp)
    } catch (error) {
            return NextResponse.json(error)
    }
}