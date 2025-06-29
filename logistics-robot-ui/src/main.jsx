import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LogisticsRobotUI from './components/LogisticsRobotUI.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LogisticsRobotUI />
  </StrictMode>,
)
