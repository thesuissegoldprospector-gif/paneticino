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
  // HSL colors from globals.css
  const primaryColor = 'hsl(45, 100%, 52%)';
  const accentColor = 'hsl(33, 100%, 65%)';
  const backgroundColor = 'hsl(195, 70%, 95%)'; // card color, "celestino"

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
          background: backgroundColor,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: accentColor }} />
              <stop offset="100%" style={{ stopColor: primaryColor }} />
            </linearGradient>
          </defs>
          <path 
                d="M 62.5,25 C 50,25 50,37.5 50,37.5 S 50,50 37.5,50 25,50 25,50 M 37.5,75 C 50,75 50,62.5 50,62.5 S 50,50 62.5,50 75,50 75,50" 
                stroke="url(#grad1)" 
                strokeWidth="15" 
                fill="none" 
                strokeLinecap="round"
                strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
