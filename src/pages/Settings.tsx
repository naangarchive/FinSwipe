import { useState } from "react";
//컴포넌트
import { Header } from "../components/layout/Header";
import { Navigation } from "../components/layout/Navigation";
import { NoticeBox } from "../components/common/NoticeBox";
//이미지
import bellAllOff from "../assets/ic_bell_all_off.svg";
import bellOff from "../assets/ic_bell_off.svg";
import bellOnBlue from "../assets/ic_bell_on_blue.svg";
import bellOnGreen from "../assets/ic_bell_on_green.svg";

export const Settings = () => {
  const [allAlarm, setAllAlarm] = useState(true);
  const [sentimentAlarm, setSentimentAlarm] = useState(false);

  const noticeBox = [
    "본 서비스에서 제공하는 정보는 투자 참고용이며, 수익성을 보장하지 않습니다. 모든 투자 결정은 본인의 책임 하에 이루어져야 하며, 투자로 인한 손실에 대해 당사는 책임지지 않습니다.",
  ];

  return (
    <>
    <Header type="sub" title="알림 및 설정" />
    <div className="px-4 py-6 pb-32 space-y-6">
      {/* 알림 설정 */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-gray-900">알림 설정</h3>
        <ul className="border border-gray-200 rounded-2xl">
          <li className="flex items-center justify-between h-24 px-4 border-b border-gray-200">
            <div className="flex gap-4 items-center">
              <img src={allAlarm ? bellOnBlue : bellAllOff} alt="" />
              <div>
                <p className="text-base text-gray-900">모든 알림 받기</p>
                <span className="text-sm text-gray-500">앱의 모든 알림을 받습니다</span>
              </div>
            </div>
            <button 
              onClick={() => setAllAlarm(prev => !prev)}
              className={`w-8 h-4.5 rounded-full transition-colors ${allAlarm ? "bg-gray-950" : "bg-neutral-300"}`}
            >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform m-px ${allAlarm ? "translate-x-3.5" : "translate-x-0"}`} />
            </button>
          </li>
          <li className="flex items-center justify-between h-24 px-4">
            <div className="flex gap-4 items-center">
              <img src={sentimentAlarm ? bellOnGreen : bellOff} alt="" />
              <div>
                <p className="text-base text-gray-900">감성분석 알림만 받기</p>
                <span className="text-sm text-gray-500">Positive/Negative 뉴스만 알림</span>
              </div>
            </div>
            <button 
              onClick={() => setSentimentAlarm(prev => !prev)}
              className={`w-8 h-4.5 rounded-full transition-colors ${sentimentAlarm ? "bg-gray-950" : "bg-neutral-300"}`}
            >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform m-px ${sentimentAlarm ? "translate-x-3.5" : "translate-x-0"}`} />
            </button>
          </li>
        </ul>
        <div className="p-4 text-sm text-blue-800 border border-blue-200 rounded-[14px] leading-relaxed bg-blue-50">
          💡 <b>감성분석 알림</b>은 시장에 큰 영향을 미칠 수 있는 긍정적(Positive) 또는 부정적(Negative) 뉴스만 선별하여 알림을 보냅니다. 중립적(Neutral) 뉴스는 제외됩니다.
        </div>
      </div>
      
      {/* 앱 정보 */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-gray-900">앱 정보</h3>
        <ul className="border border-gray-200 rounded-2xl">
          <li className="flex items-center justify-between h-18 px-4 border-b border-gray-200">
            <p className="text-base text-gray-700">버전</p>
            <p className="text-base text-gray-500">v1.0.0</p>
          </li>
          <li className="flex items-center justify-between h-18 px-4">
            <p className="text-base text-gray-700">최근 업데이트</p>
            <p className="text-base text-gray-500">2026.00.00</p>
          </li>
        </ul>
      </div>

      {/* 투자 유의사항 */}
        <NoticeBox contents={noticeBox} />
    </div>
    <Navigation showDisclaimer={false}/>
    </>
  );
};