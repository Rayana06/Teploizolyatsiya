import { Button, Form } from 'react-bootstrap'
import type { CSSProperties } from 'react'

interface CatalogFiltersProps {
  price: number
  minPrice: number
  maxPrice: number
  onPriceChange: (value: number) => void
  onApply: () => void
}

export function CatalogFilters({
  price,
  minPrice,
  maxPrice,
  onPriceChange,
  onApply,
}: CatalogFiltersProps) {
  const formatPrice = (value: number) => value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const rangeProgress = ((price - minPrice) / (maxPrice - minPrice)) * 100

  return (
    <Form
      className="filter-panel"
      aria-label="Фильтр каталога по цене"
      onSubmit={(event) => {
        event.preventDefault()
        onApply()
      }}
    >
      <Form.Label htmlFor="catalog-price">Максимальная цена теплоизоляционного материала за 1 м²: {formatPrice(price)} ₽</Form.Label>
      <div className="price-filter-row">
        <Form.Range
          id="catalog-price"
          min={minPrice}
          max={maxPrice}
          step="0.01"
          value={price}
          style={{ '--range-progress': `${rangeProgress}%` } as CSSProperties}
          onChange={(event) => onPriceChange(Number(event.target.value))}
        />
        <Button
          type="submit"
          className="price-apply-button"
          title="Подобрать товары по цене"
        >
          Подобрать
        </Button>
      </div>
      <div className="price-scale" aria-hidden="true">
        <span>{formatPrice(minPrice)} ₽/м²</span>
        <span>{formatPrice(maxPrice)} ₽/м²</span>
      </div>
    </Form>
  )
}
