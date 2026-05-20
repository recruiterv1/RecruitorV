import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import AuthPro from './context/AuthPro.jsx'

createRoot(document.getElementById('root')).render(

  
  <AuthPro>
    <BrowserRouter>
  
    <App />
  
  </BrowserRouter>
  </AuthPro>
  
  
)
