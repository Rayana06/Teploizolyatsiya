import { Badge, Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import type { InsulationMaterial } from '../types/material'
import { formatDate } from '../utils/formatters'
import { MaterialFacts } from './MaterialFacts'
import { MaterialMedia } from './MaterialMedia'

interface MaterialCardProps {
  material: InsulationMaterial
  variant: 'feed' | 'tile'
}

export function MaterialCard({ material, variant }: MaterialCardProps) {
  const isFeed = variant === 'feed'

  return (
    <Card className={`material-card material-card--${variant}`}>
      <MaterialMedia
        imageUrl={material.imageUrl}
        videoUrl={material.videoUrl}
        name={material.name}
        showVideo={isFeed}
        compact={!isFeed}
      />
      <Card.Body>
        <div className="card-kicker">
          <Badge bg="light" text="dark">{material.insulationType}</Badge>
          <span>{formatDate(material.publishedAt)}</span>
        </div>
        <Card.Title>{material.name}</Card.Title>
        <div className="brand-name">{material.brand}</div>
        <Card.Text>{material.shortDescription}</Card.Text>
        <MaterialFacts material={material} compact={!isFeed} />
        <div className="card-actions">
          <Link to={`/materials/${material.id}`} className="btn btn-dark">Подробнее</Link>
          <span className="likes"><i className="bi bi-heart" /> {material.likeCount}</span>
        </div>
      </Card.Body>
    </Card>
  )
}
