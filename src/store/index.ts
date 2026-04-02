import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import authReducer from './auth/authSlice';
import analyticsReducer from './crm/analyticsSlice';
import clientsReducer from './crm/clientsSlice';
import satisfactionReducer from './crm/satisfactionSlice';
import usersReducer from './admin/usersSlice';
import areasReducer from './admin/areasSlice';
import marketingReducer from './marketing/campaignsSlice';
import ocrDocumentsReducer from './ocr/documentsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    analytics: analyticsReducer,
    clients: clientsReducer,
    satisfaction: satisfactionReducer,
    users: usersReducer,
    areas: areasReducer,
    marketing: marketingReducer,
    ocrDocuments: ocrDocumentsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);
