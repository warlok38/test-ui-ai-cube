'use client'

import classNames from 'classnames'
import type { CSSProperties } from 'react'

import styles from './ShimmerText.module.css'

const WAVE_STAGGER_S = 0.08
const WAVE_PAUSE_S = 0.5
const WAVE_PEAK_END_RATIO = 0.18

function getWaveCycleS(charCount: number): number {
  if (charCount <= 1) {
    return WAVE_PEAK_END_RATIO + WAVE_PAUSE_S
  }

  return ((charCount - 1) * WAVE_STAGGER_S + WAVE_PAUSE_S) / (1 - WAVE_PEAK_END_RATIO)
}

export type ShimmerTextProps = {
  text: string
  className?: string
  'aria-live'?: 'polite' | 'assertive' | 'off'
}

export function ShimmerText({
  text,
  className,
  'aria-live': ariaLive = 'polite'
}: ShimmerTextProps) {
  const chars = Array.from(text)
  const cycleS = getWaveCycleS(chars.length)

  return (
    <span
      className={classNames(styles.root, className)}
      style={{ '--shimmer-cycle': `${cycleS}s` } as CSSProperties}
      aria-live={ariaLive}
    >
      {chars.map((char, index) => (
        <span
          key={index}
          className={styles.char}
          style={{ animationDelay: `${index * WAVE_STAGGER_S}s` }}
        >
          {char === ' ' ? '\u00a0' : char}
        </span>
      ))}
    </span>
  )
}
