import { create } from 'zustand';

export const useSessionStore = create((set) => ({
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
  
  selectedCause: '',
  setSelectedCause: (cause) => set({ selectedCause: cause, formData: {} }),
  
  formData: {},
  setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
  
  currentDiagnosis: null,
  setCurrentDiagnosis: (diagnosis) => set({ currentDiagnosis: diagnosis }),
  
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  isOffline: !navigator.onLine,
  setIsOffline: (offline) => set({ isOffline: offline }),
  
  queuedCount: 0,
  setQueuedCount: (count) => set({ queuedCount: count }),
  
  errorMsg: null,
  setErrorMsg: (msg) => set({ errorMsg: msg }),
  
  resetForm: () => set({ selectedCause: '', formData: {}, currentDiagnosis: null, errorMsg: null })
}));
