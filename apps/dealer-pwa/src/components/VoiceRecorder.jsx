import { useState, useRef, useEffect } from 'react';
import { useSessionStore } from '../store/useSessionStore.js';
import { submitVoiceDiagnosis } from '../lib/apiClient.js';
import { useOfflineQueue } from '../hooks/useOfflineQueue.js';

export default function VoiceRecorder({ onFallback }) {
  const { language, setCurrentDiagnosis, setIsLoading, setErrorMsg } = useSessionStore();
  const { isOffline } = useOfflineQueue();
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setErrorMsg("Voice recognition not supported in this browser. Please use the form.");
      onFallback();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech error', event);
      setIsListening(false);
      setErrorMsg("Could not understand voice. Please try again or use the form.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [onFallback, setErrorMsg]);

  useEffect(() => {
    // Process transcript once listening stops and we have something to send
    if (!isListening && transcript) {
      handleSubmission(transcript);
      setTranscript(''); // Clear immediately after sending
    }
  }, [isListening, transcript]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setErrorMsg(null);
      
      const langMap = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' };
      if (recognitionRef.current) {
        recognitionRef.current.lang = langMap[language] || 'en-IN';
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const handleSubmission = async (finalText) => {
    if (isOffline) {
      setErrorMsg("Voice diagnosis could not be sent offline. Please use the structured form.");
      onFallback();
      return;
    }

    setIsLoading(true);
    try {
      const result = await submitVoiceDiagnosis(finalText, language);
      setCurrentDiagnosis(result);
    } catch (err) {
      if (err.message === 'PII_REJECTED') {
        setErrorMsg("Personal information is not allowed in Setu.");
      } else {
        setErrorMsg("Setu could not process this request. Please try again or use the form.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-6">
      <h2 className="text-lg font-bold text-gray-800">Voice Diagnosis</h2>
      
      <button 
        onClick={toggleListen}
        className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl shadow-lg transition-transform ${isListening ? 'bg-red-500 text-white animate-pulse scale-110' : 'bg-blue-600 text-white'}`}
      >
        🎙
      </button>

      <div className="text-center h-12">
        {isListening ? (
          <p className="text-blue-600 font-medium animate-pulse">Listening... (Tap to stop)</p>
        ) : (
          <p className="text-gray-500 text-sm">Tap the microphone and describe the issue.</p>
        )}
      </div>

      <button 
        onClick={onFallback}
        className="text-sm font-semibold text-blue-600 underline"
      >
        Use structured form instead
      </button>

      <p className="text-xs text-center text-gray-400 mt-4 px-4">
        Audio is processed securely. Do not speak Aadhaar numbers or personal information.
      </p>
    </div>
  );
}
