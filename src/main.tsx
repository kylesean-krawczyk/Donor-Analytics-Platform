import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import DonorAnalyticsPlatform from './components/DonorAnalyticsPlatform.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DonorAnalyticsPlatform />
  </StrictMode>
);
