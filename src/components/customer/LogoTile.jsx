export default function LogoTile({ size = 120 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        border: '1.5px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <img
        src="/logo.png"
        alt="Smoky Bubble"
        style={{
          width: size - 8,
          height: size - 8,
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  )
}
