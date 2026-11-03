import { useState } from 'react'
import { materialsMock } from '../data/materials'
import { formatPrice } from '../utils/formatters'

export function FeedPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const material = materialsMock[currentIndex]
  const imageSource = material.feedImageUrl ?? material.imageUrl ?? '/default-media/default-insulation.jpg'

  const showNext = () => {
    setCurrentIndex((index) => (index + 1) % materialsMock.length)
  }

  return (
    <main className="feed-page">
      <section className="feed-stage">
        <img className="feed-stage__image" src={imageSource} alt={`Материал «${material.name}»`} />
        <div className="feed-stage__shade" />
        <div className="feed-stage__copy">
          <span className="material-kind">{material.insulationType}</span>
          <h1>{material.name}</h1>
          <p><i className="bi bi-caret-right-fill" /> {material.shortDescription}</p>
          <div className="feed-stage__meta">{material.thicknessMm} мм · {formatPrice(material.priceRubM2)} / м²</div>
        </div>
        <aside className="feed-stage__tools">
          <div className="feed-like"><i className="bi bi-heart" /><span>{material.likeCount}</span></div>
          <button type="button" className="feed-next" onClick={showNext} aria-label="Следующая услуга">
            <strong><i className="bi bi-arrow-right" /></strong>
            <span>Следующая</span>
          </button>
        </aside>
      </section>
    </main>
  )
}
