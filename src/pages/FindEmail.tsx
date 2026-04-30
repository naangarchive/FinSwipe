import { useState } from "react";
import { supabase } from "../lib/supabase";
//컴포넌트
import { Header } from "../components/layout/Header"
import { Input } from "../components/common/input"
import { Button } from "../components/common/button";
// 이미지
import myIcon from "../assets/ic_my.svg";

export const FindEmail = () => {
  const [username, setUsername] = useState("");
  const [foundEmail, setFoundEmail] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleFindEmail = async () => {
    setError("");
    setFoundEmail("");

    const { data, error} = await supabase
    .from('user_profiles')
    .select('email')
    .eq('login_id', username)
    .single();    

    if(error || !data) {
      setError("일치하는 이메일을 찾을 수 없습니다.");
      return;      
    }

    setFoundEmail(data.email);
  };

  return (
    <>
      <Header type="sub" title="이메일 찾기" />
      <div className="pt-8 px-4 space-y-8">
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-bold text-gray-900">가입한 이메일을 찾아드릴게요</h3>
          <p className="text-base text-gray-500">가입 시 등록한 아이디를 입력하세요</p>
        </div>
        <div className="flex flex-col gap-2">
          <Input 
            label="아이디" 
            icon={myIcon} 
            placeholder="abcdefgh"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        {foundEmail && (
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <p className="text-sm text-gray-500">찾은 이메일</p>
            <p className="text-base font-bold text-blue-600">{foundEmail}</p>
          </div>
        )}
        <Button 
          variant="primary"
          size="md"
          disabled={!username}
          onClick={handleFindEmail}
        >이메일 찾기
        </Button>
      </div>
    </>
  );
};