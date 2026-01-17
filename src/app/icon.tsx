import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  const swissRed = '#FF0000';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          background: swissRed,
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          {/* Croce svizzera bianca */}
          <rect x="38" y="19" width="24" height="62" fill="white" rx="3"/>
          <rect x="19" y="38" width="62" height="24" fill="white" rx="3"/>
          
          {/* Pagnotta stilizzata */}
          <g transform="translate(0, 5)">
              <path d="M 25,68 C 25,50 35,38 50,38 C 65,38 75,50 75,68 A 25 15 0 0 1 25,68 Z" fill="#C68E4D" stroke="#A06A3D" strokeWidth="3"/>
              {/* Tagli sul pane */}
              <path d="M 38,48 L 45,60" stroke="#A06A3D" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M 50,46 L 55,60" stroke="#A06A3D" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M 62,48 L 65,60" stroke="#A06A3D" strokeWidth="2.5" strokeLinecap="round"/>
          </g>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
