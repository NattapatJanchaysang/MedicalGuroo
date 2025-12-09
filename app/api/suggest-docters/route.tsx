import { openai } from "@/config/openaimodel";
import { AIDoctorAgents } from "@/list";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { notes } = await req.json();
  try {
    const completion = await openai.chat.completions.create({
      model: "amazon/nova-2-lite-v1:free",
      messages: [{ role: "system", content:JSON.stringify(AIDoctorAgents) },
        { role: "user", content:"User Notes/Symptoms:+"+notes+", Depends on user notes and symptoms, Please suggest list of docters , Return Object in JSON only"}
      ],
    });

    const rawResp=completion.choices[0].message
    //@ts-ignore
    const Resp=rawResp.content.trim().replace('```json','').replace('```','')
    const JSONResp=JSON.parse(Resp)
    return NextResponse.json(JSONResp)
  } catch (error) {
    return NextResponse.json(error)
  }
}
