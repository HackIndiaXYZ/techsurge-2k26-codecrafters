import { create } from 'zustand';

// Pre-seeded normal transactions from seedV2Data.js
const DEMO_TRANSACTION_POOL = [
  'TXN-SYN-0001', 'TXN-SYN-0002', 'TXN-SYN-0003', 'TXN-SYN-0004', 'TXN-SYN-0005',
  'TXN-SYN-0006', 'TXN-SYN-0007', 'TXN-SYN-0008', 'TXN-SYN-0009', 'TXN-SYN-0010'
];

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
  
  predictiveFlowActive: false,
  setPredictiveFlowActive: (isActive) => set({ predictiveFlowActive: isActive }),
  
  // Phase 5A: v2.0 Authentication Flow States
  v2FlowActive: false,
  setV2FlowActive: (isActive) => set({ v2FlowActive: isActive }),
  
  verificationState: 'IDLE', // IDLE, BIOMETRIC_VERIFICATION, AUTHENTICATED, EXCEPTION_REQUIRED, OTP_ENTRY, VERIFIED, FAILED, RATION_DISPENSE, BLOCKED, REVERIFICATION_PENDING, REVERIFICATION_RESULT
  setVerificationState: (state) => set({ verificationState: state }),
  
  transactionRef: null,
  setTransactionRef: (ref) => set({ transactionRef: ref }),
  
  selectedScenario: null, // 'NORMAL_SUCCESS', 'OTP_MATCH', 'OTP_MISMATCH'
  setSelectedScenario: (scenario) => set({ selectedScenario: scenario }),
  
  biometricResult: null,
  setBiometricResult: (result) => set({ biometricResult: result }),
  
  exceptionAuthorization: null,
  setExceptionAuthorization: (auth) => set({ exceptionAuthorization: auth }),
  
  reverifyResult: null,
  setReverifyResult: (result) => set({ reverifyResult: result }),
  
  demoPoolIndex: 0,
  getNextDemoTransaction: () => {
    let nextTxn = null;
    set((state) => {
      if (state.demoPoolIndex < DEMO_TRANSACTION_POOL.length) {
        nextTxn = DEMO_TRANSACTION_POOL[state.demoPoolIndex];
        return { demoPoolIndex: state.demoPoolIndex + 1 };
      }
      return state;
    });
    return nextTxn;
  },

  resetForm: () => set({ 
    selectedCause: '', 
    formData: {}, 
    currentDiagnosis: null, 
    errorMsg: null, 
    predictiveFlowActive: false,
    v2FlowActive: false,
    verificationState: 'IDLE',
    transactionRef: null,
    selectedScenario: null,
    biometricResult: null,
    exceptionAuthorization: null,
    reverifyResult: null
  })
}));
