"use client"
import dynamic from 'next/dynamic'

const BrotinhoApp = dynamic(() => import('../brotinho-final'), { ssr: false })

export default function Home() {
  return <BrotinhoApp />
}