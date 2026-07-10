'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Exchange } from '@/lib/types';
import { useProgress } from '@/lib/useProgress';
import { useTTS, useAudioRecorder, playExamChime, playReadyChime, playAudioFile, stopAudioPlayback } from '@/lib/useExamAudio';

interface Props {
  exchanges: Exchange[];
  dialogueId: string;
}

function isEnglish(text: string): boolean {
  return /^[A-Za-z\s.,!?'"()\-:;0-9]+$/.test(text.trim());
}

interface Evaluation {
  perfect: boolean;
  minorErrors: number;
  majorErrors: number;
  repeats: number;
  corrections: number;
}

export default function PracticeClient({ exchanges, dialogueId }: Props) {
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [direction, setDirection] = useState<'en-first' | 'other-first'>('en-first');

  // Exam simulation states
  const [examMode, setExamMode] = useState(false);
  const [isPlayingPrompt, setIsPlayingPrompt] = useState(false);
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false);
  const [repeatsUsed, setRepeatsUsed] = useState<Record<number, number>>({});
  const [correctionsUsed, setCorrectionsUsed] = useState<Record<number, number>>({});
  const [evaluations, setEvaluations] = useState<Record<number, 'perfect' | 'minor' | 'major'>>({});
  const [recordings, setRecordings] = useState<Record<number, string>>({});

  const { recordExchanges } = useProgress();
  const { speak, stop: stopTTS, speaking: ttsSpeaking } = useTTS();
  const { recording, audioUrl, startRecording, stopRecording, clearRecording } = useAudioRecorder();

  const exchange = exchanges[current];

  // Detect which field is English
  const promptIsEnglish = isEnglish(exchange.prompt);
  const englishText = promptIsEnglish ? exchange.prompt : exchange.answer;
  const translationText = promptIsEnglish ? exchange.answer : exchange.prompt;

  const showFirst  = direction === 'en-first' ? englishText : translationText;
  const showSecond = direction === 'en-first' ? translationText : englishText;
  const firstLabel  = direction === 'en-first' ? 'English' : 'Translation';
  const secondLabel = direction === 'en-first' ? 'Translation' : 'English';
  const isPromptHindi = !isEnglish(showFirst);

  // Determine which pre-generated audio file to play for the current exchange
  // Files are at /audio/{dialogueId}/{exchangeIndex}-en.m4a and -hi.m4a
  const getAudioUrl = useCallback((exchangeIndex: number, isHindi: boolean) => {
    const lang = isHindi ? 'hi' : 'en';
    return `/audio/${dialogueId}/${exchangeIndex}-${lang}.m4a`;
  }, [dialogueId]);

  // Play audio: tries the pre-generated file first, falls back to TTS
  const playSegment = useCallback(
    async (text: string, isHindi: boolean, exchangeIndex: number, onEnd: () => void) => {
      const url = getAudioUrl(exchangeIndex, isHindi);
      try {
        await playAudioFile(url, onEnd);
      } catch {
        // File not yet generated — fall back to TTS
        speak(text, isHindi, onEnd);
      }
    },
    [getAudioUrl, speak]
  );

  const startExamSegment = useCallback(async () => {
    setIsPlayingPrompt(true);
    setRevealed(false);
    clearRecording();
    // "Listen now" cue — mirrors the real NAATI exam
    await playReadyChime();
    playSegment(showFirst, isPromptHindi, current, async () => {
      // Double-beep "start speaking" cue after dialogue finishes
      await playExamChime();
      setIsPlayingPrompt(false);
      startRecording();
      setIsRecordingAnswer(true);
    });
  }, [showFirst, isPromptHindi, current, playSegment, startRecording, clearRecording]);

  // Handle toggling exam mode
  const handleToggleExamMode = useCallback((enabled: boolean) => {
    setExamMode(enabled);
    stopTTS();
    stopAudioPlayback();
    stopRecording();
    clearRecording();
    setIsPlayingPrompt(false);
    setIsRecordingAnswer(false);
    setRevealed(false);
    if (enabled) {
      // Auto start the first audio prompt
      setTimeout(() => {
        startExamSegment();
      }, 300);
    }
  }, [stopTTS, stopRecording, clearRecording, startExamSegment]);

  const reveal = useCallback(() => {
    if (examMode) {
      stopRecording();
      setIsRecordingAnswer(false);
    }
    setRevealed(true);
  }, [examMode, stopRecording]);

  // Keep track of audio URLs for completed segments
  useEffect(() => {
    if (audioUrl && examMode) {
      setRecordings(prev => ({ ...prev, [current]: audioUrl }));
    }
  }, [audioUrl, examMode, current]);

  const next = useCallback(() => {
    recordExchanges(dialogueId, 1);
    stopTTS();
    stopAudioPlayback();
    stopRecording();
    setIsRecordingAnswer(false);

    if (current < exchanges.length - 1) {
      setCurrent(c => c + 1);
      setRevealed(false);
      if (examMode) {
        // Auto trigger next audio segment
        // Let state update then trigger play
        setTimeout(() => {
          setIsPlayingPrompt(true);
          clearRecording();
          const nextIdx = current + 1;
          const nextExchange = exchanges[nextIdx];
          const nextPromptIsEnglish = isEnglish(nextExchange.prompt);
          const nextShowFirst = direction === 'en-first' 
            ? (nextPromptIsEnglish ? nextExchange.prompt : nextExchange.answer)
            : (nextPromptIsEnglish ? nextExchange.answer : nextExchange.prompt);
          const nextIsPromptHindi = !isEnglish(nextShowFirst);

          // "Listen now" cue before next dialogue
          playReadyChime().then(() => {
            playSegment(nextShowFirst, nextIsPromptHindi, nextIdx, async () => {
              // Double-beep "start speaking" cue
              await playExamChime();
              setIsPlayingPrompt(false);
              startRecording();
              setIsRecordingAnswer(true);
            });
          });
        }, 100);
      }
    } else {
      setDone(true);
    }
  }, [current, exchanges, dialogueId, recordExchanges, examMode, playSegment, startRecording, clearRecording, direction, stopTTS, stopRecording]);

  const prev = useCallback(() => {
    if (current > 0) {
      setCurrent(c => c - 1);
      setRevealed(false);
      stopTTS();
      stopAudioPlayback();
      stopRecording();
      setIsRecordingAnswer(false);
      clearRecording();
    }
  }, [current, stopTTS, stopRecording, clearRecording]);

  const restart = useCallback(() => {
    setCurrent(0);
    setRevealed(false);
    setDone(false);
    setRepeatsUsed({});
    setCorrectionsUsed({});
    setEvaluations({});
    setRecordings({});
    clearRecording();
    setIsRecordingAnswer(false);
    setIsPlayingPrompt(false);
    stopTTS();
    stopAudioPlayback();
    stopRecording();
  }, [clearRecording, stopTTS, stopRecording]);

  const handleRequestRepeat = useCallback(() => {
    setRepeatsUsed(prev => ({
      ...prev,
      [current]: (prev[current] || 0) + 1
    }));
    stopRecording();
    setIsRecordingAnswer(false);
    setIsPlayingPrompt(true);
    // "Listen now" cue before replaying
    playReadyChime().then(() => {
      playSegment(showFirst, isPromptHindi, current, async () => {
        await playExamChime();
        setIsPlayingPrompt(false);
        startRecording();
        setIsRecordingAnswer(true);
      });
    });
  }, [current, showFirst, isPromptHindi, playSegment, startRecording, stopRecording]);

  const handleTakeCorrection = useCallback(() => {
    setCorrectionsUsed(prev => ({
      ...prev,
      [current]: (prev[current] || 0) + 1
    }));
    // Simply restart recording to simulate correcting oneself
    stopRecording();
    setTimeout(() => {
      startRecording();
      setIsRecordingAnswer(true);
    }, 200);
  }, [current, startRecording, stopRecording]);

  const handleEvaluate = useCallback((rating: 'perfect' | 'minor' | 'major') => {
    setEvaluations(prev => ({ ...prev, [current]: rating }));
  }, [current]);

  // Calculate simulated NAATI score
  const calculateScoreReport = () => {
    let baseScore = 45; // Max score per dialogue in NAATI CCL is 45
    let deductions = 0;
    let totalRepeats = 0;
    let totalCorrections = 0;
    let majorErrCount = 0;
    let minorErrCount = 0;

    for (let i = 0; i < exchanges.length; i++) {
      const rep = repeatsUsed[i] || 0;
      totalRepeats += rep;
      // First repeat is free across the entire dialogue. Subsequent repeats are -1.5 points.
      if (totalRepeats > 1 && rep > 0) {
        deductions += 1.5;
      }

      const corr = correctionsUsed[i] || 0;
      totalCorrections += corr;

      const evalRating = evaluations[i] || 'perfect';
      if (evalRating === 'minor') {
        deductions += 2;
        minorErrCount++;
      } else if (evalRating === 'major') {
        deductions += 4.5;
        majorErrCount++;
      }
    }

    const finalScore = Math.max(0, Math.round((baseScore - deductions) * 2) / 2); // Round to nearest 0.5
    const isPass = finalScore >= 29; // Pass mark per dialogue is 29/45

    return {
      finalScore,
      isPass,
      totalRepeats,
      totalCorrections,
      majorErrCount,
      minorErrCount
    };
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!revealed) reveal(); else next();
      } else if (e.key === 'ArrowRight' && revealed) next();
      else if (e.key === 'ArrowLeft') prev();
    };
    if (!examMode) {
      window.addEventListener('keydown', onKey);
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [revealed, reveal, next, prev, examMode]);

  // ── Completion ─────────────────────────────────────────────────
  if (done) {
    const report = examMode ? calculateScoreReport() : null;
    return (
      <div className="flex flex-col items-center py-10 gap-5 text-center animate-popIn max-w-xl mx-auto">
        <div className="text-6xl animate-bounce-slow">🎉</div>
        <h2 className="text-2xl font-bold text-slate-800">Dialogue Practice Finished!</h2>
        
        {examMode && report ? (
          <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 my-2 text-left">
            <h3 className="font-bold text-slate-800 border-b pb-2 text-lg">Simulated Exam Score Report</h3>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600 font-medium">Estimated Score:</span>
              <span className={`text-3xl font-extrabold ${report.isPass ? 'text-emerald-600' : 'text-rose-600'}`}>
                {report.finalScore} / 45
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-t border-slate-100 text-sm">
              <span className="text-slate-500">Dialogue Result:</span>
              <span className={`font-bold px-3 py-1 rounded-full text-xs ${report.isPass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {report.isPass ? 'PASS (≥ 29)' : 'FAIL (< 29)'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-slate-600">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="block text-slate-400">Repeats Used</span>
                <span className="text-base font-bold text-slate-700">{report.totalRepeats}</span>
                <span className="block text-[10px] text-slate-400 mt-0.5">(First repeat is free, then -1.5 each)</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="block text-slate-400">Corrections Made</span>
                <span className="text-base font-bold text-slate-700">{report.totalCorrections}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="block text-slate-400">Minor Translation Errors</span>
                <span className="text-base font-bold text-amber-600">{report.minorErrCount}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="block text-slate-400">Major Translation Errors</span>
                <span className="text-base font-bold text-rose-600">{report.majorErrCount}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm max-w-xs">
            Great work — you practised all {exchanges.length} exchanges.
          </p>
        )}

        <div className="flex gap-3 mt-2">
          <button onClick={restart} className="px-5 py-2.5 rounded-xl border-2 border-indigo-200 text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-all">
            Practise again
          </button>
          <a href="/" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all">
            Choose another
          </a>
        </div>
      </div>
    );
  }

  const pct = ((current + 1) / exchanges.length) * 100;

  return (
    <div className="space-y-5">
      {/* Modes bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-slate-50 border border-slate-200 rounded-2xl p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">Practice Mode:</span>
          <div className="inline-flex bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
            <button
              onClick={() => handleToggleExamMode(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!examMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Standard
            </button>
            <button
              onClick={() => handleToggleExamMode(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${examMode ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-rose-600'}`}
            >
              ⏱️ Exam Sim
            </button>
          </div>
        </div>

        {!examMode && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setDirection('en-first')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${direction === 'en-first' ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'}`}
            >
              EN first
            </button>
            <button
              onClick={() => setDirection('other-first')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${direction === 'other-first' ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'}`}
            >
              Translate first
            </button>
          </div>
        )}
      </div>

      {/* Progress bar + counter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Segment <span className="font-bold text-slate-800">{current + 1}</span> of {exchanges.length}
          </span>
          {examMode && (
            <span className="text-xs text-rose-500 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
              Exam Conditions Active
            </span>
          )}
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${examMode ? 'bg-rose-500' : 'bg-indigo-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-8 relative overflow-hidden min-h-[160px] flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
              firstLabel === 'English' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
            }`}>{firstLabel}</span>

            {examMode && (
              <button 
                onClick={handleRequestRepeat}
                disabled={isPlayingPrompt || recording}
                className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                🔄 Repeat {repeatsUsed[current] ? `(${repeatsUsed[current]})` : ''}
              </button>
            )}
          </div>

          {examMode && isPlayingPrompt ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="flex gap-1 items-center justify-center">
                <span className="w-2.5 h-6 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-2.5 h-10 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-2.5 h-8 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                <span className="w-2.5 h-5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
              <p className="text-slate-500 text-sm font-medium italic animate-pulse">Playing audio prompt...</p>
            </div>
          ) : examMode && !revealed ? (
            <div className="flex flex-col items-center py-4 gap-3 text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 border border-rose-100 rounded-full flex items-center justify-center animate-pulse">
                🎧
              </div>
              <p className="text-slate-400 text-sm">Listen and Translate. Prompt is hidden.</p>
              
              {recording && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-0.5 justify-center items-center h-6">
                    <span className="w-1 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="w-1 h-5 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                    <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                  </div>
                  <p className="text-xs text-red-500 font-bold uppercase tracking-wider">● Recording Voice</p>
                  
                  <button
                    onClick={handleTakeCorrection}
                    className="text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-lg mt-1 transition-colors"
                  >
                    ✍️ Self-Correction
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-lg text-slate-800 leading-relaxed">{showFirst}</p>
          )}
        </div>
      </div>

      {/* Reveal / Answer controls */}
      {!revealed ? (
        <button
          onClick={reveal}
          disabled={isPlayingPrompt}
          className={`w-full py-4 rounded-2xl text-white text-base font-bold active:scale-[0.98] transition-all shadow-md ${
            examMode 
              ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100 disabled:opacity-50' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
          }`}
        >
          {examMode ? '⏹️ Stop & Reveal translation' : `Show ${secondLabel}`}
        </button>
      ) : (
        <>
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl px-6 py-8 animate-slideDown">
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${
              secondLabel === 'English' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
            }`}>{secondLabel}</span>
            <p className="text-lg text-slate-800 leading-relaxed">{showSecond}</p>
          </div>

          {examMode && recordings[current] && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 animate-fadeIn">
              <span className="text-xs font-bold text-slate-500 block">Your Spoken Answer:</span>
              <audio src={recordings[current]} controls className="w-full h-8" />
            </div>
          )}

          {examMode && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 animate-fadeIn">
              <span className="text-xs font-bold text-slate-500 block">Self-Evaluation Rubric:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleEvaluate('perfect')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    evaluations[current] === 'perfect' || !evaluations[current]
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🟢 Good / Perfect
                </button>
                <button
                  onClick={() => handleEvaluate('minor')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    evaluations[current] === 'minor'
                      ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🟡 Minor Error (-2.0)
                </button>
                <button
                  onClick={() => handleEvaluate('major')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    evaluations[current] === 'major'
                      ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🔴 Major Error (-4.5)
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 animate-fadeIn">
            <button
              onClick={prev}
              disabled={current === 0}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button
              onClick={next}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 transition-all"
            >
              {current === exchanges.length - 1 ? '🎉 Finish' : 'Next'}
              {current < exchanges.length - 1 && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
