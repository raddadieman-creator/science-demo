import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/readex-pro/arabic-300.css'
import '@fontsource/readex-pro/arabic-400.css'
import '@fontsource/readex-pro/arabic-500.css'
import '@fontsource/readex-pro/arabic-600.css'
import '@fontsource/readex-pro/latin-400.css'
import '@fontsource/readex-pro/latin-600.css'
import '@fontsource/alexandria/arabic-600.css'
import '@fontsource/alexandria/arabic-700.css'
import '@fontsource/alexandria/arabic-800.css'
import '@fontsource/alexandria/latin-700.css'
import '@fontsource/alexandria/latin-800.css'
import App from './App.jsx'
import './styles.css'

document.documentElement.lang = 'ar'
document.documentElement.dir = 'rtl'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
