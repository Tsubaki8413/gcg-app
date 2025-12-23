import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// 仮のコンポーネント（後で作り込みます）
const CardList = () => <div className="p-4"><h2>CARD LIST (Coming Soon)</h2></div>;
const DeckList = () => <div className="p-4"><h2>DECK LIST (Coming Soon)</h2></div>;
const SoloPlay = () => <div className="p-4"><h2>SOLO PLAY (Coming Soon)</h2></div>;

// 共通フッター（仮）
const Footer = () => (
  <nav style={{ 
    position: 'fixed', bottom: 0, width: '100%', 
    background: 'white', borderTop: '1px solid #ddd',
    display: 'flex', justifyContent: 'space-around', padding: '10px' 
  }}>
    <Link to="/">Card List</Link>
    <Link to="/deck">Deck List</Link>
    <Link to="/play">Solo Play</Link>
  </nav>
);

function App() {
  return (
    <BrowserRouter>
      <div style={{ paddingBottom: '60px' }}>
        <Routes>
          <Route path="/" element={<CardList />} />
          <Route path="/deck" element={<DeckList />} />
          <Route path="/play" element={<SoloPlay />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;