function Footer() {
  const appStatus = process.env.REACT_APP_STATUS || 'Unknown Mode';
  const appVersion = process.env.REACT_APP_VERSION || '1.0.0';
  const appEnv = process.env.REACT_APP_ENV || 'development';
  const isDevelopment = appEnv === 'development';

  return (
    <footer
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '8px 16px',
        backgroundColor: isDevelopment ? '#CE9E7A' : '#4CAF50',
        borderTop: '2px solid black',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px',
        fontFamily: 'Montserrat, sans-serif',
        color: 'black',
        zIndex: 1000,
      }}
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold' }}>{appStatus}</span>
        <span>v{appVersion}</span>
      </div>

      {process.env.REACT_APP_DEBUG === 'true' && (
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          <span>API: {process.env.REACT_APP_API_URL}</span>
        </div>
      )}
    </footer>
  );
}

export default Footer;
