"use client"

import { Button } from '@/components/ui/button'
import { img } from 'motion/react-client'
import React, { useState } from 'react'
import AddNewSessionDialog from './AddNewSessionDialog'

function HistoryList() {
    const [historyList,setHistorylist] = useState([])
  return (
    <div>
        {historyList.length==0?
        <div className='flex flex-col items-center justify-center border-2 border-dashed rounded mt-5 gap-2 py-6'>
            <img src="medical-assistance.png" alt="empty" width={200} height={200}/>
            <h2 className='font-bold mt-4'>No Recent Consultations</h2>
            <p>It looks like you haven't consulted with any docters yet.</p>
            <AddNewSessionDialog />
        </div> :
        <div>
            
        </div>}
    </div>
  )
}

export default HistoryList