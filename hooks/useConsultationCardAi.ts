'use client';

import { useReducer } from 'react';

export type ConsultationPoint = { id: string; text: string };

export type ConsultationCardAiState = {
  learningSummary: string;
  evidenceSummary: string;
  consultationPoints: ConsultationPoint[];
  parentMessage: string;
  hasGenerated: boolean;
  source: 'gemini' | 'rules' | null;
  fallbackReason: string | null;
  backend: string | null;
};

const INITIAL: ConsultationCardAiState = {
  learningSummary: '',
  evidenceSummary: '',
  consultationPoints: [],
  parentMessage: '',
  hasGenerated: false,
  source: null,
  fallbackReason: null,
  backend: null,
};

export function pointsFromStrings(texts: string[]): ConsultationPoint[] {
  return texts.map((text) => ({ id: crypto.randomUUID(), text }));
}

export function pointsToStrings(points: ConsultationPoint[]): string[] {
  return points.map((p) => p.text).filter(Boolean);
}

type Action =
  | { type: 'RESET' }
  | { type: 'SET_LEARNING_SUMMARY'; value: string }
  | { type: 'SET_EVIDENCE_SUMMARY'; value: string }
  | { type: 'SET_PARENT_MESSAGE'; value: string }
  | { type: 'SET_POINT'; id: string; text: string }
  | {
      type: 'SET_GENERATED';
      learningSummary: string;
      evidenceSummary: string;
      consultationPoints: string[];
      parentMessage: string;
      source: 'gemini' | 'rules' | null;
      fallbackReason: string | null;
      backend: string | null;
    }
  | {
      type: 'PATCH_FROM_SESSION';
      learningSummary?: string;
      parentMessage?: string;
      evidenceSummary?: string;
    };

function aiReducer(state: ConsultationCardAiState, action: Action): ConsultationCardAiState {
  switch (action.type) {
    case 'RESET':
      return { ...INITIAL };
    case 'SET_LEARNING_SUMMARY':
      return { ...state, learningSummary: action.value };
    case 'SET_EVIDENCE_SUMMARY':
      return { ...state, evidenceSummary: action.value };
    case 'SET_PARENT_MESSAGE':
      return { ...state, parentMessage: action.value };
    case 'SET_POINT':
      return {
        ...state,
        consultationPoints: state.consultationPoints.map((p) =>
          p.id === action.id ? { ...p, text: action.text } : p
        ),
      };
    case 'SET_GENERATED':
      return {
        ...state,
        learningSummary: action.learningSummary,
        evidenceSummary: action.evidenceSummary,
        consultationPoints: pointsFromStrings(action.consultationPoints),
        parentMessage: action.parentMessage,
        hasGenerated: true,
        source: action.source,
        fallbackReason: action.fallbackReason,
        backend: action.backend,
      };
    case 'PATCH_FROM_SESSION':
      return {
        ...state,
        learningSummary: action.learningSummary ?? state.learningSummary,
        parentMessage: action.parentMessage ?? state.parentMessage,
        evidenceSummary: action.evidenceSummary ?? state.evidenceSummary,
        hasGenerated: true,
      };
    default:
      return state;
  }
}

export function useConsultationCardAi() {
  const [state, dispatch] = useReducer(aiReducer, INITIAL);
  return { aiState: state, dispatch };
}
