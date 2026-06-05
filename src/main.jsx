import React from 'react'
import ReactDOM from 'react-dom/client'
import { initTheme } from './lib/theme'
initTheme();
import App from '@/App.jsx'
import '@/index.css'
import { registerPWA } from '@/registerPWA'

registerPWA()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)