import { useState, useEffect } from 'react';
import { resolveAssetUrl } from '../utils/api';

function ImageSlider({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const resolveImage = (img) => {
    if (!img) return 'https://via.placeholder.com/1200x800?text=No+Image';
    return resolveAssetUrl(img);
  };

  // Handle ESC key to close fullscreen
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (!images || images.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        background: 'var(--neutral-100)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 'var(--spacing-xl)'
      }}>
        <p style={{ color: 'var(--neutral-400)' }}>No images available</p>
      </div>
    );
  }

  const goNext = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goPrev = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const toggleFullscreen = (e) => {
    e.stopPropagation();
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden', 
        borderRadius: 'inherit',
        cursor: 'zoom-in'
      }} onDoubleClick={toggleFullscreen}>
        <div style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: 'transform 0.5s ease-in-out'
        }}>
          {images.map((img, idx) => (
            <img
              key={idx}
              src={resolveImage(img)}
              alt={`Slide ${idx}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                flexShrink: 0,
                imageRendering: 'auto' // Ensures standard high-quality rendering
              }}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/1200x800?text=Image+Unavailable';
              }}
            />
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={goPrev}
              style={{
                position: 'absolute',
                top: '50%',
                left: 'var(--spacing-md)',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 10
              }}
            >
              ←
            </button>
            <button
              onClick={goNext}
              style={{
                position: 'absolute',
                top: '50%',
                right: 'var(--spacing-md)',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 10
              }}
            >
              →
            </button>

            <div style={{
              position: 'absolute',
              bottom: 'var(--spacing-md)',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 'var(--spacing-xs)',
              zIndex: 10
            }}>
              {images.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: idx === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                    transition: 'background 0.3s ease'
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Fullscreen Preview Overlay */}
      {isFullscreen && (
        <div 
          onClick={() => setIsFullscreen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out'
          }}
        >
          <button 
            onClick={() => setIsFullscreen(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '24px',
              cursor: 'pointer',
              zIndex: 10001
            }}
          >
            ×
          </button>

          {images.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                style={{
                  position: 'absolute',
                  left: '20px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  fontSize: '24px',
                  cursor: 'pointer',
                  zIndex: 10001
                }}
              >
                ←
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                style={{
                  position: 'absolute',
                  right: '20px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  fontSize: '24px',
                  cursor: 'pointer',
                  zIndex: 10001
                }}
              >
                →
              </button>
            </>
          )}

          <img 
            src={resolveImage(images[currentIndex])}
            alt="Fullscreen preview"
            style={{
              maxWidth: '95%',
              maxHeight: '95%',
              objectFit: 'contain',
              boxShadow: '0 0 30px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          
          <div style={{
            position: 'absolute',
            bottom: '20px',
            color: 'white',
            background: 'rgba(0,0,0,0.5)',
            padding: '5px 15px',
            borderRadius: '20px'
          }}>
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}

export default ImageSlider;
