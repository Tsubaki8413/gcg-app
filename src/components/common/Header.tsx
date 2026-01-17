export const Header = () => {
  return (
    <header style={{
      height: '60px',
      backgroundColor: '#42A5F5', // ガンダムブルー
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      zIndex: 100,
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    }}>
      <h1 style={{ 
        margin: 0, 
        fontSize: '20px', 
        fontWeight: 'bold' 
      }}>
        GCG Mobile Analyzer
      </h1>
    </header>
  );
};