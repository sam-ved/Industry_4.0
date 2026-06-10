import { ReactNode } from 'react'

export interface BackgroundGlowProps {
  children?: ReactNode
  className?: string
}

export default function BackgroundGlow(props: BackgroundGlowProps): JSX.Element
