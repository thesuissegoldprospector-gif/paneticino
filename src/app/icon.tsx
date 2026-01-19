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
          <rect x="38" y="19" width="24" height="62" fill="white" rx="3"/>
          <rect x="19" y="38" width="62" height="24" fill="white" rx="3"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
