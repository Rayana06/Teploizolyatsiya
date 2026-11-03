import { useEffect, useMemo, useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { CatalogFilters } from '../components/CatalogFilters'
import { MaterialCard } from '../components/MaterialCard'
import { materialsMock } from '../data/materials'

const MIN_PRICE = Math.min(...materialsMock.map((material) => material.priceRubM2))
const MAX_PRICE = Math.max(...materialsMock.map((material) => material.priceRubM2))

export function CatalogPage() {
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(MAX_PRICE)
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(MAX_PRICE)

  const filteredMaterials = useMemo(() => {
    return materialsMock.filter((material) => material.priceRubM2 <= appliedMaxPrice)
  }, [appliedMaxPrice])

  useEffect(() => {
    document.title = `Плитка (${filteredMaterials.length}) — Теплощит`
    return () => { document.title = 'Теплощит — теплоизоляционные материалы' }
  }, [filteredMaterials.length])

  return (
    <main className="catalog-page">
      <Container className="content-shell page-section">
        <h1>Каталог материалов</h1>
        <CatalogFilters
          price={selectedMaxPrice}
          minPrice={MIN_PRICE}
          maxPrice={MAX_PRICE}
          onPriceChange={setSelectedMaxPrice}
          onApply={() => setAppliedMaxPrice(selectedMaxPrice)}
        />
        <div className="catalog-meta">
          <span>Найдено: {filteredMaterials.length}</span>
          <small>mock-коллекция</small>
        </div>
        {filteredMaterials.length > 0 ? (
          <Row className="g-4">
            {filteredMaterials.map((material) => (
              <Col md={6} xl={4} key={material.id}>
                <MaterialCard material={material} variant="tile" />
              </Col>
            ))}
          </Row>
        ) : (
          <div className="empty-state">
            <i className="bi bi-search" />
            <h3>Материалы не найдены</h3>
            <p>Увеличьте максимальную цену и нажмите «Подобрать».</p>
          </div>
        )}
      </Container>
    </main>
  )
}
