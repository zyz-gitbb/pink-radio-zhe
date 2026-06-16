import { ImageResponse } from 'next/og'
 
// Image metadata
export const size = {
  width: 512,
  height: 512,
}
export const contentType = 'image/png'
 
// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 24,
          background: '#D4858A',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '128px', // 圆角效果
          color: 'white',
          position: 'relative',
        }}
      >
        {/* 内部圆圈（唱片中心） */}
        <div
          style={{
            position: 'absolute',
            width: '160px',
            height: '160px',
            backgroundColor: '#F5F1E6',
            borderRadius: '50%',
          }}
        />
        {/* 内部小孔 */}
        <div
          style={{
            position: 'absolute',
            width: '40px',
            height: '40px',
            backgroundColor: '#D4858A',
            borderRadius: '50%',
          }}
        />
        {/* 唱针或装饰 */}
        <div
          style={{
            position: 'absolute',
            top: '80px',
            right: '80px',
            width: '20px',
            height: '120px',
            backgroundColor: '#F5F1E6',
            transform: 'rotate(45deg)',
            borderRadius: '10px',
          }}
        />
      </div>
    ),
    {
      // For convenience, we can re-use the exported icons size metadata
      // config to also set the ImageResponse's width and height.
      ...size,
    }
  )
}
