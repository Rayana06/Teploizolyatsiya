import type { InsulationMaterial } from '../types/material'
import { formatPrice } from '../utils/formatters'

interface MaterialFactsProps {
  material: InsulationMaterial
  compact?: boolean
}

export function MaterialFacts({ material, compact = false }: MaterialFactsProps) {
  return (
    <div className={`material-facts${compact ? ' material-facts--compact' : ''}`}>
      <span><i className="bi bi-layers" /> {material.thicknessMm} мм</span>
      <span><i className="bi bi-tag" /> {formatPrice(material.priceRubM2)} / м²</span>
      {!compact && <span><i className="bi bi-house" /> {material.application}</span>}
    </div>
  )
}
