import { useEffect, useRef, useState } from 'react';
import { generateSrcSet, getOptimizedImageUrl, imageSizePresets, ImageSize } from '../lib/imageOptimization';

interface ImageWithSkeletonProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  preset?: 'productCard' | 'featuredProduct' | 'cartThumbnail' | 'productDetail';
  sizes?: string;
}

export function ImageWithSkeleton({
  src,
  alt,
  className = '',
  priority = false,
  preset = 'productCard',
  sizes,
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  // Las imágenes prioritarias (primeras visibles) se cargan de inmediato.
  // El resto se cargan de forma anticipada cuando se acercan al viewport.
  const [shouldLoad, setShouldLoad] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeConfig = imageSizePresets[preset];
  const isSingleSize = !Array.isArray(sizeConfig);

  const imageSrc = isSingleSize
    ? getOptimizedImageUrl(src, sizeConfig as ImageSize)
    : getOptimizedImageUrl(src, (sizeConfig as ImageSize[])[0]);

  const srcSet = !isSingleSize
    ? generateSrcSet(src, sizeConfig as ImageSize[])
    : undefined;

  const defaultSizes = sizes || (() => {
    switch (preset) {
      case 'productCard':
        return '(max-width: 640px) 160px, (max-width: 1024px) 240px, 280px';
      case 'featuredProduct':
        return '(max-width: 640px) 160px, (max-width: 1024px) 240px, 280px';
      case 'cartThumbnail':
        return '80px';
      case 'productDetail':
        return '(max-width: 768px) 100vw, 50vw';
      default:
        return '100vw';
    }
  })();

  // Precarga anticipada: empieza a descargar la imagen cuando está a ~600px
  // de entrar en pantalla, de modo que ya esté lista al hacer scroll (incluso rápido).
  useEffect(() => {
    if (priority || shouldLoad) return;

    const el = containerRef.current;
    if (!el) return;

    // Fallback si el navegador no soporta IntersectionObserver.
    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      {
        // Empieza a cargar 600px antes (vertical) de que la imagen entre en pantalla.
        rootMargin: '600px 0px',
        threshold: 0,
      }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [priority, shouldLoad]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-900">
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse" />
      )}
      {shouldLoad && (
        <img
          src={imageSrc}
          srcSet={srcSet}
          sizes={defaultSizes}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
}
