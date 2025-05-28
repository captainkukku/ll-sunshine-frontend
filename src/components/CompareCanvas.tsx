import React from 'react';
import CompareImage from 'react-compare-image';
import './CompareCanvas.css';

interface Props{
  official:string;
  shot:string;
}

const CompareCanvas:React.FC<Props>=({official,shot})=>(
  <div className="compare-wrapper">
    <CompareImage leftImage={official} rightImage={shot} />
  </div>
);

export default CompareCanvas;
