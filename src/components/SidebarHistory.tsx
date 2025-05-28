import React from 'react';
import { Point, CheckinInfo } from '../types';
import './SidebarHistory.css';

interface Props{
  points:Point[];
  checkins:Record<string,CheckinInfo>;
  onSelect(id:string):void;
}

const SidebarHistory:React.FC<Props>=({points,checkins,onSelect})=>(
  <div className="history-bar">
    {points.filter(p=>checkins[p.id]).map(p=>{
      const info=checkins[p.id];
      const thumb=info.hasImage?info.url:'/assets/placeholder.png';
      return(
        <img key={p.id}
             title={p.id}
             src={thumb}
             className="history-thumb"
             onClick={()=>onSelect(p.id)}/>
      )
    })}
  </div>
);

export default SidebarHistory;
