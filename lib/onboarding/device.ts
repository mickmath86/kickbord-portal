'use client'

import { useSyncExternalStore } from 'react'

function detect() {
  const ua = navigator.userAgent
  const phoneOrTablet = /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle|BlackBerry|Opera Mini|IEMobile/i.test(ua)
  // iPadOS reports itself as a Mac; touch support gives it away.
  const iPad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  const touchOnly = window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches
  return phoneOrTablet || iPad || (touchOnly && window.innerWidth < 1024)
}

const noop = () => () => {}

/**
 * True on phones and tablets. The CRM web app does not work there, so the setup stage asks for a computer.
 * Null during server render.
 */
export function useIsMobileDevice(): boolean | null {
  return useSyncExternalStore(noop, detect, () => null)
}
