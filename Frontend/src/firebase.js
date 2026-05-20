import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyATcyYwF5jNK2KHHQp7nyWOVom_kdyZ6uE",
  authDomain: "recruitorv-1291c.firebaseapp.com",
  projectId: "recruitorv-1291c",
  storageBucket: "recruitorv-1291c.firebasestorage.app",
  messagingSenderId: "625961410451",
  appId: "1:625961410451:web:e2baf0c293eb9e36aa9266"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set auth persistence with fallback for mobile browsers
// This is critical for mobile/iPad where localStorage might be restricted
const initializeAuthPersistence = async () => {
  try {
    // Try to use local persistence (survives browser restarts)
    await setPersistence(auth, browserLocalPersistence);
    console.log("Firebase auth persistence set to LOCAL");
  } catch (error) {
    console.warn("Failed to set LOCAL persistence, falling back to SESSION:", error);
    try {
      // Fallback to session persistence (survives page reloads but not browser restarts)
      await setPersistence(auth, browserSessionPersistence);
      console.log("Firebase auth persistence set to SESSION");
    } catch (fallbackError) {
      console.error("Failed to set any auth persistence:", fallbackError);
      // Auth will still work but won't persist across reloads
    }
  }
};

// Initialize persistence immediately
initializeAuthPersistence();

export const googleProvider = new GoogleAuthProvider();
