import { Navigate, Route, Routes } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { BrandHeader } from './components/BrandHeader'
import { CatalogPage } from './pages/CatalogPage'
import { FeedPage } from './pages/FeedPage'
import { MaterialDetailsPage } from './pages/MaterialDetailsPage'

export default function App() {
  return (
    <div className="app-shell">
      <BrandHeader />
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/materials/:materialId" element={<MaterialDetailsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
