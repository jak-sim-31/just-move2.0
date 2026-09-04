import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SAMPLE_EXERCISES } from '@/constants/exercises';
import type {
  Exercise,
  ExerciseRecord,
  ExerciseSchedule,
  ProofPhoto,
} from '@/constants/types';

// ─── Storage keys ────────────────────────────────────────────────────────────
const KEYS = {
  EXERCISES: 'justmove_exercises',
  SCHEDULES: 'justmove_schedules',
  RECORDS:   'justmove_records',
  SETTINGS:  'justmove_settings',
  PHOTOS:    'justmove_photos',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Settings {
  onboardingDone: boolean;
  notificationEnabled: boolean;
}

interface AppState {
  exercises: Exercise[];
  schedules: ExerciseSchedule[];
  records: ExerciseRecord[];
  photos: ProofPhoto[];
  settings: Settings;
  isLoading: boolean;
  // Session (current exercise flow)
  selectedPosition: string | null;
  selectedMinutes: number | null;
  selectedExercise: Exercise | null;
  currentRecordId: string | null;
}

type AppAction =
  | { type: 'INIT'; payload: Pick<AppState, 'exercises' | 'schedules' | 'records' | 'photos' | 'settings'> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_POSITION'; payload: string }
  | { type: 'SET_MINUTES'; payload: number }
  | { type: 'SET_EXERCISE'; payload: Exercise }
  | { type: 'SET_CURRENT_RECORD_ID'; payload: string | null }
  | { type: 'RESET_SESSION' }
  | { type: 'ADD_RECORD'; payload: ExerciseRecord }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'ADD_SCHEDULE'; payload: ExerciseSchedule }
  | { type: 'UPDATE_SCHEDULE'; payload: { id: string; status: ExerciseSchedule['status'] } }
  | { type: 'ADD_PHOTO'; payload: ProofPhoto }
  | { type: 'DELETE_PHOTO'; payload: string };

const initialState: AppState = {
  exercises: [],
  schedules: [],
  records: [],
  photos: [],
  settings: { onboardingDone: false, notificationEnabled: true },
  isLoading: true,
  selectedPosition: null,
  selectedMinutes: null,
  selectedExercise: null,
  currentRecordId: null,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INIT':
      return { ...state, ...action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_POSITION':
      return { ...state, selectedPosition: action.payload };
    case 'SET_MINUTES':
      return { ...state, selectedMinutes: action.payload };
    case 'SET_EXERCISE':
      return { ...state, selectedExercise: action.payload };
    case 'SET_CURRENT_RECORD_ID':
      return { ...state, currentRecordId: action.payload };
    case 'RESET_SESSION':
      return {
        ...state,
        selectedPosition: null,
        selectedMinutes: null,
        selectedExercise: null,
        currentRecordId: null,
      };
    case 'ADD_RECORD':
      return { ...state, records: [action.payload, ...state.records].slice(0, 50) };
    case 'DELETE_RECORD':
      return { ...state, records: state.records.filter((r) => r.id !== action.payload) };
    case 'ADD_SCHEDULE':
      return { ...state, schedules: [action.payload, ...state.schedules] };
    case 'UPDATE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.map((s) =>
          s.id === action.payload.id ? { ...s, status: action.payload.status } : s
        ),
      };
    case 'ADD_PHOTO':
      return { ...state, photos: [action.payload, ...state.photos] };
    case 'DELETE_PHOTO':
      return { ...state, photos: state.photos.filter((p) => p.id !== action.payload) };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface AppContextValue extends AppState {
  setPosition: (pos: string) => void;
  setMinutes: (min: number) => void;
  setExercise: (ex: Exercise) => void;
  setCurrentRecordId: (id: string | null) => void;
  resetSession: () => void;
  addRecord: (record: ExerciseRecord) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  addSchedule: (schedule: ExerciseSchedule) => Promise<void>;
  updateSchedule: (id: string, status: ExerciseSchedule['status']) => Promise<void>;
  addPhoto: (photo: ProofPhoto) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  getExerciseById: (id: string) => Exercise | undefined;
  getTodayRecords: () => ExerciseRecord[];
  getTodaySchedules: () => ExerciseSchedule[];
  getPhotoForRecord: (recordId: string) => ProofPhoto | undefined;
  generateId: () => string;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const [exRaw, schedRaw, recRaw, settRaw, photoRaw] = await Promise.all([
          AsyncStorage.getItem(KEYS.EXERCISES),
          AsyncStorage.getItem(KEYS.SCHEDULES),
          AsyncStorage.getItem(KEYS.RECORDS),
          AsyncStorage.getItem(KEYS.SETTINGS),
          AsyncStorage.getItem(KEYS.PHOTOS),
        ]);

        const exercises: Exercise[] = exRaw ? JSON.parse(exRaw) : SAMPLE_EXERCISES;
        const schedules: ExerciseSchedule[] = schedRaw ? JSON.parse(schedRaw) : [];
        const records: ExerciseRecord[] = recRaw ? JSON.parse(recRaw) : [];
        const settings: Settings = settRaw
          ? JSON.parse(settRaw)
          : { onboardingDone: false, notificationEnabled: true };
        const photos: ProofPhoto[] = photoRaw ? JSON.parse(photoRaw) : [];

        // Seed exercises if empty
        if (!exRaw) {
          await AsyncStorage.setItem(KEYS.EXERCISES, JSON.stringify(SAMPLE_EXERCISES));
        }

        dispatch({ type: 'INIT', payload: { exercises, schedules, records, settings, photos } });
      } catch (e) {
        // AsyncStorage 파싱 오류 시 기본값으로 복구
        dispatch({
          type: 'INIT',
          payload: {
            exercises: SAMPLE_EXERCISES,
            schedules: [],
            records: [],
            settings: { onboardingDone: false, notificationEnabled: true },
            photos: [],
          },
        });
      }
    })();
  }, []);

  const generateId = useCallback((): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }, []);

  const setPosition = useCallback((pos: string) => {
    dispatch({ type: 'SET_POSITION', payload: pos });
  }, []);

  const setMinutes = useCallback((min: number) => {
    dispatch({ type: 'SET_MINUTES', payload: min });
  }, []);

  const setExercise = useCallback((ex: Exercise) => {
    dispatch({ type: 'SET_EXERCISE', payload: ex });
  }, []);

  const setCurrentRecordId = useCallback((id: string | null) => {
    dispatch({ type: 'SET_CURRENT_RECORD_ID', payload: id });
  }, []);

  const resetSession = useCallback(() => {
    dispatch({ type: 'RESET_SESSION' });
  }, []);

  const addRecord = useCallback(async (record: ExerciseRecord) => {
    dispatch({ type: 'ADD_RECORD', payload: record });
    try {
      const current = await AsyncStorage.getItem(KEYS.RECORDS);
      const existing: ExerciseRecord[] = current ? JSON.parse(current) : [];
      const updated = [record, ...existing].slice(0, 50);
      await AsyncStorage.setItem(KEYS.RECORDS, JSON.stringify(updated));
    } catch {}
  }, []);

  const deleteRecord = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_RECORD', payload: id });
    try {
      const current = await AsyncStorage.getItem(KEYS.RECORDS);
      const existing: ExerciseRecord[] = current ? JSON.parse(current) : [];
      await AsyncStorage.setItem(
        KEYS.RECORDS,
        JSON.stringify(existing.filter((r) => r.id !== id))
      );
    } catch {}
  }, []);

  const addSchedule = useCallback(async (schedule: ExerciseSchedule) => {
    dispatch({ type: 'ADD_SCHEDULE', payload: schedule });
    try {
      const current = await AsyncStorage.getItem(KEYS.SCHEDULES);
      const existing: ExerciseSchedule[] = current ? JSON.parse(current) : [];
      await AsyncStorage.setItem(KEYS.SCHEDULES, JSON.stringify([schedule, ...existing]));
    } catch {}
  }, []);

  const updateSchedule = useCallback(
    async (id: string, status: ExerciseSchedule['status']) => {
      dispatch({ type: 'UPDATE_SCHEDULE', payload: { id, status } });
      try {
        const current = await AsyncStorage.getItem(KEYS.SCHEDULES);
        const existing: ExerciseSchedule[] = current ? JSON.parse(current) : [];
        const updated = existing.map((s) => (s.id === id ? { ...s, status } : s));
        await AsyncStorage.setItem(KEYS.SCHEDULES, JSON.stringify(updated));
      } catch {}
    },
    []
  );

  const addPhoto = useCallback(async (photo: ProofPhoto) => {
    dispatch({ type: 'ADD_PHOTO', payload: photo });
    try {
      const current = await AsyncStorage.getItem(KEYS.PHOTOS);
      const existing: ProofPhoto[] = current ? JSON.parse(current) : [];
      await AsyncStorage.setItem(KEYS.PHOTOS, JSON.stringify([photo, ...existing]));
    } catch {}
  }, []);

  const deletePhoto = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_PHOTO', payload: id });
    try {
      const current = await AsyncStorage.getItem(KEYS.PHOTOS);
      const existing: ProofPhoto[] = current ? JSON.parse(current) : [];
      await AsyncStorage.setItem(
        KEYS.PHOTOS,
        JSON.stringify(existing.filter((p) => p.id !== id))
      );
    } catch {}
  }, []);

  const getExerciseById = useCallback(
    (id: string) => state.exercises.find((e) => e.id === id),
    [state.exercises]
  );

  const getTodayRecords = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    return state.records.filter((r) => r.completedAt.startsWith(today));
  }, [state.records]);

  const getTodaySchedules = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    return state.schedules.filter(
      (s) =>
        (s.scheduledDate === today || s.repeatType === 'daily') &&
        s.status === 'scheduled'
    );
  }, [state.schedules]);

  const getPhotoForRecord = useCallback(
    (recordId: string) => state.photos.find((p) => p.recordId === recordId),
    [state.photos]
  );

  return (
    <AppContext.Provider
      value={{
        ...state,
        setPosition,
        setMinutes,
        setExercise,
        setCurrentRecordId,
        resetSession,
        addRecord,
        deleteRecord,
        addSchedule,
        updateSchedule,
        addPhoto,
        deletePhoto,
        getExerciseById,
        getTodayRecords,
        getTodaySchedules,
        getPhotoForRecord,
        generateId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
