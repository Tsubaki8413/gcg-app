import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { CardGrid } from './components/features/CardList/CardGrid'; // インポート追加

// 仮のコンポーネント
const DeckList = () => <div className="p-4"><h2>DECK LIST (Coming Soon)</h2></div>;
const SoloPlay = () => <div className="p-4"><h2>SOLO PLAY (Coming Soon)</h2></div>;

const Footer = () => (
  <nav style={{ 
    position: 'fixed', bottom: 0, width: '100%', 
    background: 'white', borderTop: '1px solid #ddd',
    display: 'flex', justifyContent: 'space-around', padding: '10px',
    zIndex: 100
  }}>
    <Link to="/" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Card List</Link>
    <Link to="/deck" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Deck List</Link>
    <Link to="/play" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Solo Play</Link>
  </nav>
);

function App() {
  return (
    <BrowserRouter>
      <div style={{ paddingBottom: '60px', minHeight: '100vh', background: '#F5F7FA' }}>
        <Routes>
          <Route path="/" element={<CardGrid />} />
          <Route path="/deck" element={<DeckList />} />
          <Route path="/play" element={<SoloPlay />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;