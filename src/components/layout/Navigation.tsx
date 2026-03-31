import { useNavigate, useLocation } from "react-router-dom";
//이미지
import homeOff from '../../assets/ic_home.svg';
import homeOn from '../../assets/ic_home_on.svg';
import searchOff from '../../assets/ic_search.svg';
import searchOn from '../../assets/ic_search_on.svg';
import likeOff from '../../assets/ic_heart.svg';
import likeOn from '../../assets/ic_heart_on.svg';
import myOff from '../../assets/ic_mypage.svg';
import myOn from '../../assets/ic_mypage_on.svg';

const NAV_ITEMS = [
  { path: "/",       label: "홈",   on: homeOn,   off: homeOff   },
  { path: "/search", label: "검색", on: searchOn, off: searchOff },
  { path: "/like",   label: "관심", on: likeOn,   off: likeOff   },
  { path: "/my",     label: "마이", on: myOn,     off: myOff     },
];

interface NavigationProps {
  showDisclaimer?: boolean; //투자 경고 문구
}

export const Navigation = ({ showDisclaimer = false }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full min-w-80 max-w-107.5 bg-white">
      {showDisclaimer && (
        <div>투자경고</div>
      )}

      <nav className="flex items-center justify-around z-50 pb-safe">
        {NAV_ITEMS.map(({path, label, on, off}) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`w-14 h-14 flex items-center justify-center transition-colors ${isActive ? "bg-blue-600/10 rounded-2xl" : ""}`}>
              <img src={isActive? on : off} alt={label} />
            </button>
          );
        })}
      </nav>
    </div>
  );
};