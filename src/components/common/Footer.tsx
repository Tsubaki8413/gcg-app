import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <nav style={{ 
      position: 'fixed', 
      bottom: 0, 
      width: '100%', 
      background: 'white', 
      borderTop: '1px solid #ddd',
      display: 'flex', 
      justifyContent: 'space-around', 
      padding: '10px',
      zIndex: 100
    }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>
        Card List
      </Link>
      <Link to="/deck" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>
        Deck List
      </Link>
      <Link to="/play" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>
        Solo Play
      </Link>
    </nav>
  );
};