export type MaterialType = 'Минеральная вата' | 'Пенополистирол' | 'PIR-плита'

export interface InsulationMaterial {
  id: number
  name: string
  brand: string
  shortDescription: string
  insulationType: MaterialType
  application: string
  thicknessMm: number
  priceRubM2: number
  publishedAt: string
  imageUrl: string | null
  feedImageUrl: string | null
  videoUrl: string | null
  likeCount: number
}

export type MaterialSort = 'newest' | 'name' | 'price-asc' | 'price-desc'
