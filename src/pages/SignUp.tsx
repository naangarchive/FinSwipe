import { useState } from "react";
import { Link } from "react-router-dom";
//컴포넌트
import { Header } from "../components/layout/Header"
import { Input } from "../components/common/input";
import { Button } from "../components/common/button";
import { Checkbox } from "../components/common/checkbox";
import { NoticeBox } from "../components/common/NoticeBox";
// 이미지
import mailIcon from "../assets/ic_email.svg";
import tellIcon from "../assets/ic_tell.svg";
import myIcon from "../assets/ic_my.svg";
import pwIcon from "../assets/ic_password.svg";

export const SignUp = () => {

  // 체크박스 상태 관리
  const [isTermsChecked, setTermsChecked] = useState(false);
  const [isDisclaimerChecked, setDisclaimerChecked] = useState(false);

  //전체 동의 여부
  const isAllChecked = isTermsChecked && isDisclaimerChecked;

  //전체 동의 이벤트 핸들러
  const handleAllCheck = (checked:boolean) => {
    setTermsChecked(checked);
    setDisclaimerChecked(checked);
  };

  //투자경고 텍스트 박스
  const noticeBox = [
    "• 본 서비스는 투자 참고용 정보를 제공합니다.",
    "• 제공되는 정보는 수익을 보장하지 않습니다.",
    "• 모든 투자 결정은 본인의 책임 하에 이루어집니다.",
    "• 투자로 인한 손실에 대해 당사는 책임지지 않습니다.",
    "• 투자 전 반드시 충분한 검토가 필요합니다.",
  ];

  return (
    <>
      <Header type="sub" title="회원가입" />
      <div className="px-4 py-6">
        <div className="flex flex-col gap-2.5 mb-8">
          <h3 className="text-2xl font-bold text-gray-900">FinSwipe에 오신 것을 환영합니다</h3>
          <p className="text-basic text-gray-500">간편하게 가입하고 금융 뉴스를 만나보세요</p>
        </div>

        {/* 회원가입 입력폼 */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Input 
              label="이메일"
              placeholder="example@email.com"
              icon={mailIcon}
            />
            <Button variant="outline" size="md" disabled>인증번호 받기</Button>
          </div>
          <div className="flex flex-col gap-2">
            <Input 
              label="휴대폰 번호"
              placeholder="01012345678"
              icon={tellIcon}
            />
            <Button variant="outline" size="md" disabled>인증번호 받기</Button>
          </div>          
          <Input 
            label="닉네임"
            placeholder="사용하실 닉네임을 입력하세요"
            icon={myIcon}
          />
          <Input 
            label="비밀번호"
            isPassword
            placeholder="비밀번호 (8자 이상)"
            icon={pwIcon}
          />
          <Input 
            label="비밀번호 확인"
            isPassword
            placeholder="비밀번호를 다시 입력하세요"
            icon={pwIcon}
          />
        </div>

        {/* 투자 위험 고지 및 동의 */}
        <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-gray-200">
          <Checkbox 
            id="all"
            size="md"
            isBold={true}
            checked={isAllChecked}
            onChange={handleAllCheck}
            label="전체 동의"
          />
          <div className="flex flex-col gap-3 pl-9">
            <Checkbox 
              id="terms"
              size="sm"            
              checked={isTermsChecked}
              onChange={setTermsChecked}
              label={<span>이용약관 동의 <span className="text-blue-600">(필수)</span></span>}
            />
            <Checkbox 
              id="disclaimer"
              size="sm"            
              checked={isDisclaimerChecked}
              onChange={setDisclaimerChecked}
              label={<span>투자 유의사항 동의 <span className="text-blue-600">(필수)</span></span>}
            />
          </div>
          <NoticeBox contents={noticeBox}/>          
        </div>
        <Button className="mt-10 mb-6" variant="primary" size="lg" disabled>가입하기</Button>
        <div className="flex justify-center gap-3 text-gray-600 text-base">
          이미 계정이 있으신가요?
          <Link to="/Login" className="text-blue-600 font-semibold">로그인</Link>
        </div>
      </div>
    </>
  );
};