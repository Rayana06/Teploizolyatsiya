import { Button, Container } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MaterialFacts } from '../components/MaterialFacts'
import { MaterialMedia } from '../components/MaterialMedia'
import { materialsMock } from '../data/materials'
import { formatDate } from '../utils/formatters'

export function MaterialDetailsPage() {
  const { materialId } = useParams()
  const navigate = useNavigate()
  const material = materialsMock.find((item) => item.id === Number(materialId))

  if (!material) {
    return (
      <main className="not-found">
        <i className="bi bi-exclamation-circle" />
        <h1>Материал не найден</h1>
        <Link to="/catalog" className="btn btn-dark">Вернуться в каталог</Link>
      </main>
    )
  }

  return (
    <main className="details-page">
      <Container className="content-shell page-section">
        <Button variant="link" className="back-link" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" /> Назад
        </Button>
        <div className="details-grid">
          <MaterialMedia imageUrl={material.imageUrl} videoUrl={material.videoUrl} name={material.name} showVideo />
          <article className="details-copy">
            <span className="eyebrow">{material.insulationType}</span>
            <h1>{material.name}</h1>
            <div className="brand-name">{material.brand}</div>
            <p className="details-lead">{material.shortDescription}</p>
            <MaterialFacts material={material} />
            <dl className="details-list">
              <div><dt>Назначение</dt><dd>{material.application}</dd></div>
              <div><dt>Опубликовано</dt><dd>{formatDate(material.publishedAt)}</dd></div>
              <div><dt>Нравится</dt><dd><i className="bi bi-heart" /> {material.likeCount}</dd></div>
            </dl>
            <div className="guest-note"><i className="bi bi-info-circle" /> Добавление и вход недоступны в гостевом режиме.</div>
          </article>
        </div>
      </Container>
    </main>
  )
}
