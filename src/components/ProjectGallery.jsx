import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

// Shared project screenshot gallery used by BOTH the employer project-details
// page and the student portfolio preview, so the layout/spacing is identical:
//   - 1 main large image on top
//   - the remaining images in a responsive grid beneath (1 large + 3 = 4 total)
//   - a fullscreen lightbox with prev/next
//
// `images` is an array of ready-to-use src strings. Renders nothing when empty,
// and stays clean with fewer than 4 images (no broken grid).
export default function ProjectGallery({ images = [], title = "Project" }) {
  const shots = (images || []).filter(Boolean);
  const [lightbox, setLightbox] = useState(null); // open index, null = closed

  if (shots.length === 0) return null;

  const close = () => setLightbox(null);
  const prev = () => setLightbox((i) => (i - 1 + shots.length) % shots.length);
  const next = () => setLightbox((i) => (i + 1) % shots.length);

  return (
    <>
      {/* Primary screenshot (large, on top) */}
      <button
        type="button"
        onClick={() => setLightbox(0)}
        className="block w-full overflow-hidden rounded-xl border border-gray-100"
      >
        <img
          src={shots[0]}
          alt={`${title} main screenshot`}
          className="h-auto w-full object-cover transition hover:opacity-95"
          loading="lazy"
          decoding="async"
        />
      </button>

      {/* Additional screenshots in a grid beneath */}
      {shots.length > 1 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shots.slice(1).map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setLightbox(i + 1)}
              className="overflow-hidden rounded-lg border border-gray-100"
            >
              <img
                src={src}
                alt={`${title} screenshot ${i + 2}`}
                className="h-32 w-full object-cover transition hover:opacity-90"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close image viewer"
          >
            <X className="h-6 w-6" />
          </button>

          {shots.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Next image"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}

          <img
            src={shots[lightbox]}
            alt={`${title} screenshot ${lightbox + 1}`}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {shots.length > 1 && (
            <p className="absolute bottom-4 text-sm text-white/70">
              {lightbox + 1} / {shots.length}
            </p>
          )}
        </div>
      )}
    </>
  );
}
