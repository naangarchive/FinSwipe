import { useEffect } from "react";
import { initGA } from "./lib/analytics/config";
import Router from './shared/Router';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { supabase } from './lib/supabase';
import './lib/firebase';


function App() {

  useEffect(() => {
    initGA();
    
    const initPush = async () => {
      try {
        await FirebaseMessaging.requestPermissions();
        
        const { token } = await FirebaseMessaging.getToken({
          vapidKey: import.meta.env.VITE_VAPID_KEY
        });

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await fetch(`/news/device-token?user_id=${session.user.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch (error) {
        console.error('푸시 초기화 실패:', error);
      }
    };
    initPush();
  }, []);

  return (
    <div className="min-h-screen flex justify-center">
      <div className='w-full min-w-80 max-w-107.5 bg-white relative'>
        <Router />
      </div>
    </div>
  );
}

export default App;

