import { useEffect, useRef, useState } from 'react'

const DEFAULT_IMAGE = '/default-media/default-insulation.jpg'
const DEFAULT_VIDEO = '/default-media/default-insulation.mp4'
const VIDEO_ZOOM_DURATION = 3500
const VIDEO_START_TRANSFORM = 'translateX(8%) translateY(10%) scale(2.8)'
const VIDEO_END_TRANSFORM = 'translateX(8%) translateY(11%) scale(2.95)'

const formatVideoTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

interface MaterialMediaProps {
  imageUrl: string | null
  videoUrl?: string | null
  name: string
  showVideo?: boolean
  compact?: boolean
}

export function MaterialMedia({ imageUrl, videoUrl, name, showVideo = false, compact = false }: MaterialMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoFrameRef = useRef<HTMLDivElement>(null)
  const zoomAnimationRef = useRef<Animation | null>(null)
  const [imageFailed, setImageFailed] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [videoMuted, setVideoMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const imageSource = !imageUrl || imageFailed ? DEFAULT_IMAGE : imageUrl
  const videoSource = !videoUrl || videoFailed ? DEFAULT_VIDEO : videoUrl
  const usesDefaultImage = imageSource === DEFAULT_IMAGE
  const usesDefaultVideo = videoSource === DEFAULT_VIDEO
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const video = videoRef.current
    if (!video || reduceMotion) return

    const animation = video.animate(
      [
        { transform: VIDEO_START_TRANSFORM },
        { transform: VIDEO_END_TRANSFORM },
      ],
      { duration: VIDEO_ZOOM_DURATION, easing: 'ease-in-out', fill: 'both' },
    )
    animation.pause()
    animation.currentTime = Math.min(video.currentTime * 1000, VIDEO_ZOOM_DURATION)
    zoomAnimationRef.current = animation

    return () => {
      animation.cancel()
      zoomAnimationRef.current = null
    }
  }, [reduceMotion, videoSource])

  useEffect(() => {
    if (!videoPlaying) return

    let animationFrameId = 0
    const updateProgress = () => {
      const video = videoRef.current
      if (video) setCurrentTime(video.currentTime)
      animationFrameId = requestAnimationFrame(updateProgress)
    }

    animationFrameId = requestAnimationFrame(updateProgress)
    return () => cancelAnimationFrame(animationFrameId)
  }, [videoPlaying])

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play()
    else video.pause()
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setVideoMuted(video.muted)
  }

  const seekVideo = (value: string) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Number(value)
    if (zoomAnimationRef.current) {
      zoomAnimationRef.current.currentTime = Math.min(video.currentTime * 1000, VIDEO_ZOOM_DURATION)
    }
    setCurrentTime(video.currentTime)
  }

  const syncZoomAnimation = (video: HTMLVideoElement) => {
    const animation = zoomAnimationRef.current
    if (animation) animation.currentTime = Math.min(video.currentTime * 1000, VIDEO_ZOOM_DURATION)
  }

  const toggleFullscreen = () => {
    const frame = videoFrameRef.current
    if (!frame) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void frame.requestFullscreen()
  }

  return (
    <div className={`material-media${compact ? ' material-media--compact' : ''}`}>
      <div className="media-frame">
        <img src={imageSource} alt={`Материал «${name}»`} onError={() => setImageFailed(true)} />
        {usesDefaultImage && <span className="fallback-label"><i className="bi bi-image" /> изображение по умолчанию</span>}
      </div>
      {showVideo && (
        <div ref={videoFrameRef} className={`media-frame media-frame--video${videoPlaying ? ' is-playing' : ''}`}>
          <video
            ref={videoRef}
            key={videoSource}
            preload="metadata"
            playsInline
            onClick={togglePlayback}
            onPlay={(event) => {
              syncZoomAnimation(event.currentTarget)
              setVideoPlaying(true)
            }}
            onPlaying={(event) => {
              syncZoomAnimation(event.currentTarget)
              zoomAnimationRef.current?.play()
            }}
            onWaiting={() => zoomAnimationRef.current?.pause()}
            onPause={(event) => {
              syncZoomAnimation(event.currentTarget)
              zoomAnimationRef.current?.pause()
              setVideoPlaying(false)
            }}
            onEnded={(event) => {
              syncZoomAnimation(event.currentTarget)
              zoomAnimationRef.current?.pause()
              setVideoPlaying(false)
            }}
            onLoadedMetadata={(event) => {
              setCurrentTime(0)
              setDuration(event.currentTarget.duration)
            }}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onError={() => {
              setVideoPlaying(false)
              setVideoFailed(true)
            }}
          >
            <source src={videoSource} type="video/mp4" />
            Ваш браузер не поддерживает видео.
          </video>
          <div className="video-controls" aria-label="Управление видео">
            <div className="video-controls__row">
              <button type="button" onClick={togglePlayback} aria-label={videoPlaying ? 'Пауза' : 'Воспроизвести'}>
                <i className={`bi ${videoPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`} />
              </button>
              <span className="video-controls__time">{formatVideoTime(currentTime)} / {formatVideoTime(duration)}</span>
              <span className="video-controls__spacer" />
              <button type="button" onClick={toggleMute} aria-label={videoMuted ? 'Включить звук' : 'Выключить звук'}>
                <i className={`bi ${videoMuted ? 'bi-volume-mute-fill' : 'bi-volume-up-fill'}`} />
              </button>
              <button type="button" onClick={toggleFullscreen} aria-label="Полноэкранный режим">
                <i className="bi bi-fullscreen" />
              </button>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => seekVideo(event.target.value)}
              aria-label="Позиция видео"
            />
          </div>
          {usesDefaultVideo && <span className="fallback-label"><i className="bi bi-camera-video" /> видео по умолчанию</span>}
        </div>
      )}
    </div>
  )
}
