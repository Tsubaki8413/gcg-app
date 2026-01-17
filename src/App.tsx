import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { CardGrid } from './components/features/CardList/CardGrid';

// 仮のコンポーネント
const DeckList = () => <div className="p-4" style={{ paddingTop: '80px' }}><h2>DECK LIST (Coming Soon)</h2></div>;
const SoloPlay = () => <div className="p-4" style={{ paddingTop: '80px' }}><h2>SOLO PLAY (Coming Soon)</h2></div>;

function App() {
  return (
    <BrowserRouter>
      <div className="App" style={{ minHeight: '100vh', background: '#F5F7FA' }}>
        <Header />
        
        {/* コンテンツエリア: ヘッダー(60px)とフッター(約50px)の分を考慮して余白を調整 */}
        <main style={{ paddingTop: '60px', paddingBottom: '60px' }}>
          <Routes>
            <Route path="/" element={<CardGrid />} />
            <Route path="/deck" element={<DeckList />} />
            <Route path="/play" element={<SoloPlay />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;