// import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';

//컴포넌트
//이미지
import Logo from "../assets/logo.svg";
import LogoTxt from "../assets/logo_tx_white.svg";
import Google from "../assets/ic_google.svg";

export const Login = () => {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Google 로그인
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

      window.dispatchEvent(new Event('login'));

      navigate('/');
    } catch (error) {
      console.error("구글 로그인 처리 중 에러:", error);
      alert("로그인에 실패했습니다.");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 p-6 py-16 bg-[linear-gradient(180deg,rgba(0,100,255,1)_0%,rgba(0,82,204,1)_100%)]">
        <div className="flex items-center gap-3">
          <img src={Logo} alt="" />
          <img src={LogoTxt} alt="" />
        </div>
        <p className="text-lg text-white opacity-90">금융 뉴스를 스마트하게</p>
      </div>

      <div className="relative space-y-8 -mt-6 pt-8 px-4 bg-white rounded-t-3xl">
        <div className="flex flex-col gap-1">
          <h3 className="text-2xl font-bold text-gray-900">로그인</h3>
          <p className="text-base text-gray-500">계정에 로그인하여 시작하세요</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative w-full h-14">
            {/* 보이는 커스텀 버튼 */}
            <div className="flex items-center justify-center gap-4 w-full h-14 text-base font-semibold text-gray-700 border rounded-xl border-gray-200 pointer-events-none">
              <img src={Google} alt="" />
              Google 간편 로그인
            </div>
            {/* GoogleLogin을 위에 투명하게 덮음 */}
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
        </div>
        <div className="flex justify-center items-center text-base text-gray-600 gap-2">
          계정이 없으신가요?
          <Link to="/signUp" className="text-base text-blue-600 font-semibold">회원가입</Link>
        </div>
      </div>
    </>
  );
};