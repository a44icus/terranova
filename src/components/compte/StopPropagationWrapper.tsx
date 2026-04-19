"use client"

export default function StopPropagationWrapper({ children, className }: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <span onClick={e => e.preventDefault()} className={className}>
      {children}
    </span>
  )
}