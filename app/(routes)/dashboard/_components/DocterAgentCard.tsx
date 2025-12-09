"use client";

import React from "react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import Image from 'next/image'



export type docterAgent = {
        id: number,
        specialist: string,
        description: string,
        image: string,
        agentPrompt: string,
        voiceId: string,
        subscriptionRequired: boolean
}

type props={
    docterAgent:docterAgent
}




function DocterAgentCard({docterAgent}:props) {
  return (
    <CardContainer className="inter-var h-50 w-full">
      <CardBody className="bg-gray-50 relative group/card  dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border  ">
        <CardItem
          translateZ="50"
          className="text-xl font-bold text-neutral-600 dark:text-white"
        >
          {docterAgent.specialist}
        </CardItem>
        <CardItem
          as="p"
          translateZ="60"
          className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
        >
          {docterAgent.description}
        </CardItem>
        <CardItem translateZ="100" className="w-full mt-4">
          <img
            src={docterAgent.image}
            height="1000"
            width="1000"
            className="h-40 w-full object-cover rounded-xl group-hover/card:shadow-xl"
            alt={docterAgent.specialist}
          />
        </CardItem>
        <div className="flex justify-between items-center mt-5">
          <CardItem
            translateZ={20}
            as="a"
            href="https://twitter.com/mannupaaji"
            target="__blank"
            className="px-4 py-2 rounded-xl text-xs font-normal dark:text-white"
          >
            Start Consultation →
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  );
}

export default DocterAgentCard
