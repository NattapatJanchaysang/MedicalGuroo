import { AIDoctorAgents } from '@/list'
import { div } from 'motion/react-client'
import React from 'react'
import DocterAgentCard from './DocterAgentCard'

function DoctersAgentList() {
  return (
    <div className='mt-6 flex flex-col'>
        <h2 className='font-bold text-xl mb-8'>AI Specialist Docters Agent</h2>
        <div className='gap-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
            {AIDoctorAgents.map((docter, index)=>(
                <div key={index}>
                    <DocterAgentCard docterAgent={docter}/>
                </div>
            ))}
        </div>
    </div>
  )
}

export default DoctersAgentList