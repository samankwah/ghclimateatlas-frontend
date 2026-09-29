import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'react-loading-skeleton/dist/skeleton.css'
import './index.css'
import RootApp from './RootApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
)
