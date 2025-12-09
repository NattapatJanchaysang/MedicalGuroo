"use client"
import React, { useState } from 'react'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowRight, Loader2 } from 'lucide-react'
import axios from 'axios'
import DocterAgentCard, { docterAgent } from './DocterAgentCard'
import SuggestedDocterCard from './SuggestedDocterCard'


function AddNewSessionDialog() {
  const [note,setNote] = useState <string> ()
  const [loading,setLoading] = useState(false)
  const [suggestedDocters,setSuggestedDocters] = useState<docterAgent[]>()
  const [selectedDocter,setSelectedDocter]=useState<docterAgent>()
  const OnclickNext= async ()=>{
    setLoading(true)
    const result=await axios.post('/api/suggest-docters',{
      notes:note
    })

    console.log(result.data)
    if (Array.isArray(result.data)) {
        setSuggestedDocters(result.data)
    } else {
        // กรณี API ส่งมาเป็น Object เราต้องหาว่า Array อยู่ที่ key ไหน
        // ลองใส่ชื่อ key ที่น่าจะเป็นไปได้ เช่น 'doctors', 'agents' หรือ 'result'
        // หรือใช้ Object.values เพื่อดึงค่าแรกที่เป็น Array ออกมา
        const dataValues = Object.values(result.data);
        if (dataValues.length > 0 && Array.isArray(dataValues[0])) {
             // @ts-ignore
             setSuggestedDocters(dataValues[0]);
        } else {
             // Fallback กรณีหาไม่เจอ ให้เป็น array ว่างไว้ก่อนกัน Error
             setSuggestedDocters([]); 
        }
    }
    setLoading(false)
  }

  const onStartConsultation= async ()=>{
    setLoading(true)
    // Save All info to database
    const result = await axios.post('/api/session-chat',{
      notes:note,
      selectedDocter:selectedDocter
    })
    console.log(result.data)
    if(result.data?.sessionId){
      console.log(result.data.sessionId)
      //Route new data screen
    }
    setLoading(false)
  }

  return (
    <Dialog>
      <DialogTrigger asChild><Button className='my-2'>+ Start a Consultation</Button></DialogTrigger>
  <DialogContent >
    <DialogHeader>
      <DialogTitle>Add Basic Details</DialogTitle>
      <DialogDescription asChild>
        {!suggestedDocters ? <div>
          {/* // Ask an User Symptoms */}
          <h2 className='mb-4'>Add Symptoms or Any Other Details</h2>
          <Textarea className='h-[140px]' placeholder='Add Details here...'
          onChange={(e)=>setNote(e.target.value)}/>
        </div> : 
        <div>
          <h2 className='py-1'>Select the docter</h2>
        <div className='grid grid-cols-3'>
          {/* // Show suggestedDocters */}  
          {suggestedDocters.map((docter,index)=>(
            <SuggestedDocterCard docterAgent={docter} key={index} setSelectedDocter={()=>setSelectedDocter(docter)}
            selectedDocter={selectedDocter}/>
          ))}
        </div>
        </div>}
      </DialogDescription>
    </DialogHeader>
    <DialogFooter >
      <DialogClose asChild>
        <Button variant={'outline'}>Cancel</Button>
        </DialogClose>
      {!suggestedDocters ? <Button disabled={!note || loading} onClick={()=>OnclickNext()}>
        Next {loading ? <Loader2 className='animate-spin'/> : <ArrowRight />}
        </Button> : 
        <Button onClick={()=>onStartConsultation()} disabled={ loading || !selectedDocter}>Start Consultation
        {loading ? <Loader2 className='animate-spin'/> : <ArrowRight />}</Button>}
    </DialogFooter>
  </DialogContent>
</Dialog>
  )
}

export default AddNewSessionDialog