import React from 'react'
import { docterAgent } from './DocterAgentCard'
import Image from 'next/image'


type props={
    docterAgent:docterAgent
    setSelectedDocter:any
    selectedDocter?:docterAgent
}

function SuggestedDocterCard({docterAgent,setSelectedDocter, selectedDocter}:props) {
  return (
    <div className={`flex flex-col items-center justify-between border shadow 
      rounded-2xl p-4 m-2 hover:scale-110 cursor-pointer ${selectedDocter?.id==docterAgent.id&&'scale-110 border-2 border-primary'}`}
    onClick={()=>setSelectedDocter(docterAgent)}>
        <Image src={docterAgent.image} alt={docterAgent.description}
        width={70}
        height={70}
        className='h-[50px] w-[50px] rounded-4xl object-cover'/>
        <h2 className='font-bold text-sm'>{docterAgent.specialist}</h2>
        <p className='text-xs line-clamp-2'>{docterAgent.description}</p>
    </div>
  )
}

export default SuggestedDocterCard