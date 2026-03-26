import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { store } from './store';
import { setAccessToken, clearAuth } from './store/auth/authSlice';
import { configureApiClient } from './api/client';
import { AppRouter } from './router';
import './index.css';

// Wire the Redux store into the API client (avoids circular dependency)
configureApiClient(
  () => store.getState().auth,
  {
    setAccessToken: (token) => store.dispatch(setAccessToken(token)),
    clearAuth: () => store.dispatch(clearAuth()),
  },
);

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró el elemento #root');

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <AppRouter />
      <Toaster richColors position="top-right" />
    </Provider>
  </StrictMode>,
);
