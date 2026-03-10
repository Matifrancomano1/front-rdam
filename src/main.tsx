import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import AppRouter from './router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter/>
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable={false}
      toastClassName="!rounded-xl !text-sm !font-medium"
    />
  </StrictMode>
)
