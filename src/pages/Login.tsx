import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { getWebPushToken } from '../lib/firebase';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';
import Logo from "../assets/logo.svg";
import LogoTxt from "../assets/logo_tx_white.svg";
import Google from "../assets/ic_google.svg";

export const Login = () => {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleGoogleLogin = async (idToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) throw new Error("서버 인증 실패");

      const data = await response.json();
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('userId', data.user_id);
      localStorage.setItem('email', data.email);
      localStorage.setItem('displayName', data.display_name);

      // 푸시 알림 토큰
      try {
        const check = await FirebaseMessaging.checkPermissions();
        if (check.receive === 'granted') {
          let token = '';
          if (Capacitor.isNativePlatform()) {
            const result = await FirebaseMessaging.getToken();
            token = result.token;
          } else {
            const webToken = await getWebPushToken();
            if (webToken) token = webToken;
          }
          if (token) {
            await fetch(`${API_BASE_URL}/news/device-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${data.access_token}`,
              },
              body: JSON.stringify({ token, platform: Capacitor.isNativePlatform() ? 'android' : 'web' }),
            });
          }
        }
      } catch (pushError) {
        console.error("푸시 알림 설정 중 에러:", pushError);
      }

      window.dispatchEvent(new Event('login'));
      navigate('/');
    } catch (error) {
      console.error("구글 로그인 처리 중 에러:", error);
      alert("로그인에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[linear-gradient(180deg,#0064FF_0%,#0052CC_100%)]">
      {/* 상단 로고 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 pb-12">
        <div className="flex items-center gap-3">
          <img src={Logo} alt="" className="h-12" />
          <img src={LogoTxt} alt="" className="h-8" />
        </div>
        <div className="text-center">
          <p className="text-white text-xl font-semibold mb-2">금융 뉴스를 스마트하게</p>
          <p className="text-white/60 text-sm leading-relaxed">
            관심 종목의 뉴스를 한눈에 확인하고{'\n'}
            AI 인사이트로 투자 흐름을 파악하세요
          </p>
        </div>

        {/* 피처 카드들 */}
        <div className="flex gap-3 w-full max-w-xs">
          {[
            { icon: '📰', title: '뉴스 카드', desc: '스와이프로 빠르게' },
            { icon: '🤖', title: 'AI 요약', desc: '핵심만 3줄로' },
            { icon: '📊', title: '보조지표', desc: 'RSI · MACD' },
          ].map((f, i) => (
            <div key={i} className="flex-1 bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
              <p className="text-2xl mb-1">{f.icon}</p>
              <p className="text-white text-[11px] font-bold">{f.title}</p>
              <p className="text-white/50 text-[9px] mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 로그인 영역 */}
      <div className="bg-white rounded-t-3xl px-6 pt-8 pb-12 flex flex-col gap-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900">시작하기</h3>
          <p className="text-sm text-gray-400 mt-1">Google 계정으로 간편하게 로그인하세요</p>
        </div>

        {/* 구글 로그인 버튼 */}
        <div className="relative w-full h-14">
          <div className="flex items-center justify-center gap-3 w-full h-14 text-base font-semibold text-gray-700 border border-gray-200 rounded-2xl pointer-events-none shadow-sm">
            <img src={Google} alt="" className="w-5 h-5" />
            Google로 계속하기
          </div>
          <div className="absolute inset-0 opacity-0">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  handleGoogleLogin(credentialResponse.credential);
                }
              }}
              onError={() => alert("구글 계정 연결에 실패했습니다.")}
              width="500"
            />
          </div>
        </div>

        <p className="text-[11px] text-gray-300 text-center leading-relaxed">
          로그인 시 <span className="underline">이용약관</span> 및 <span className="underline">개인정보처리방침</span>에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
};