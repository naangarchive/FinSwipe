import { useNavigate } from "react-router-dom";
import type { NewsCardData } from '../../types/news';
//유틸리티
import { getTimeAgo } from "../../utils/time";
import { getSourceName } from "../../utils/format";
//이미지
import defaultThumb from "../../assets/thumb_img.jpg";


export const Article = ({ data, groupTicker, articles }: { 
  data: NewsCardData;
  groupTicker: string;
  articles: NewsCardData[];
  index: number;
  }) => {

  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/detail/${data.id}`, { state: {groupTicker, articles} });
  };

  const isRead = !!data.is_read;

  return (
    <div
      onClick={handleCardClick}
      className={`overflow-hidden flex gap-3 w-full min-h-26 p-4  bg-white border border-gray-200 rounded-[14px]
        ${isRead ? 'opacity-40 grayscale-20' : 'opacity-100'}
    `}>
      <div className="grow">
        <p className="text-base font-medium text-gray-900">{data.headlineKo}</p>
        <div className="flex gap-1 mt-1">
          <p className="text-xs text-gray-500">{getSourceName(data.sourceUrl)}</p>
          <p className="text-xs text-gray-500">{getTimeAgo(data.publishedAt)}</p>          
        </div>
      </div>      
      <div className='overflow-hidden shrink-0 w-16 h-16 rounded-[10px] bg-gray-100'>
        <img src={data.imageUrl || defaultThumb} alt="" className='w-full h-full object-cover'/>
      </div>
    </div>
  );
};