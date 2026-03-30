import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import UnlockScreen from "./components/UnlockScreen";
import ReaderShell from "./components/ReaderShell";
import { parsedDocument } from "./lib/document";
import { loadReaderPreferences, loadUnlockState, saveUnlockState } from "./lib/storage";

const DEFAULT_UNLOCK = { unlocked: false, method: null };

export default function App() {
  const [unlockState, setUnlockState] = useState(() => loadUnlockState() || DEFAULT_UNLOCK);
  const [preferences, setPreferences] = useState(() => loadReaderPreferences());

  useEffect(() => {
    document.title = unlockState.unlocked
      ? `${parsedDocument.title} · Reader`
      : `${parsedDocument.title} · Unlock`;
  }, [unlockState.unlocked]);

  const handleUnlock = useCallback((method) => {
    const nextState = { unlocked: true, method };
    setUnlockState(nextState);
    saveUnlockState(nextState);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            unlockState.unlocked ? (
              <Navigate to="/read" replace />
            ) : (
              <UnlockScreen onUnlock={handleUnlock} />
            )
          }
        />
        <Route
          path="/read"
          element={
            unlockState.unlocked ? (
              <ReaderShell
                documentData={parsedDocument}
                preferences={preferences}
                setPreferences={setPreferences}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to={unlockState.unlocked ? "/read" : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
