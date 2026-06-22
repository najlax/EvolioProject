import { useRef, useState } from "react";
import { ImagePlus, X, RefreshCw } from "lucide-react";

// Editable image gallery for the Add/Edit Project form. It matches the employer
// project-details layout (1 large primary image + a small grid beneath) but adds
// add / replace / remove controls. Controlled component:
//   images: array of { id?, url, file? }
//     - existing images have `id` + `url` (absolute)
//     - newly added images have `file` + `url` (a local data URL preview)
//   onChange(nextImages): called whenever the list changes
//   max: maximum number of images (default 4)
const readAsDataURL = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

export default function ProjectImageEditor({ images = [], onChange, max = 4 }) {
  const addRef = useRef(null);
  const replaceRef = useRef(null);
  const [replaceIndex, setReplaceIndex] = useState(null);

  const remaining = max - images.length;

  async function handleAdd(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-selecting the same file later
    if (!files.length) return;
    const slice = files.slice(0, Math.max(0, remaining));
    const added = await Promise.all(
      slice.map(async (file) => ({ file, url: await readAsDataURL(file) }))
    );
    onChange([...images, ...added]);
  }

  async function handleReplace(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file || replaceIndex === null) return;
    const url = await readAsDataURL(file);
    const next = images.map((img, i) => (i === replaceIndex ? { file, url } : img));
    setReplaceIndex(null);
    onChange(next);
  }

  function remove(index) {
    onChange(images.filter((_, i) => i !== index));
  }

  function triggerReplace(index) {
    setReplaceIndex(index);
    if (replaceRef.current) replaceRef.current.click();
  }

  // Small overlay with replace + remove buttons, shown on every image.
  function Controls({ index }) {
    return (
      <div className="absolute right-2 top-2 flex gap-1">
        <button
          type="button"
          onClick={() => triggerReplace(index)}
          className="rounded-full bg-white/90 p-1 text-gray-600 shadow hover:bg-white"
          aria-label="Replace image"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => remove(index)}
          className="rounded-full bg-white/90 p-1 text-gray-600 shadow hover:bg-white"
          aria-label="Remove image"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Hidden inputs */}
      <input
        ref={addRef}
        type="file"
        accept="image/png,image/jpeg"
        multiple
        className="hidden"
        onChange={handleAdd}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleReplace}
      />

      {images.length === 0 ? (
        // Empty state: one big add box.
        <div
          role="button"
          tabIndex={0}
          onClick={() => addRef.current && addRef.current.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              addRef.current && addRef.current.click();
          }}
          className="upload-box cursor-pointer p-6 hover:border-[#3199CC]"
        >
          <ImagePlus className="mb-2 h-7 w-7 text-gray-400" />
          <p className="text-sm text-gray-500">
            Click to add images (up to {max}, PNG or JPG)
          </p>
        </div>
      ) : (
        <>
          {/* Primary (large) image */}
          <div className="relative overflow-hidden rounded-xl border border-gray-100">
            <img
              src={images[0].url}
              alt="Primary project screenshot"
              className="max-h-72 w-full object-cover"
            />
            <Controls index={0} />
          </div>

          {/* Smaller images + add tile */}
          {(images.length > 1 || remaining > 0) && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.slice(1).map((img, i) => (
                <div
                  key={img.id ?? `new-${i}`}
                  className="relative overflow-hidden rounded-lg border border-gray-100"
                >
                  <img
                    src={img.url}
                    alt={`Project screenshot ${i + 2}`}
                    className="h-32 w-full object-cover"
                  />
                  <Controls index={i + 1} />
                </div>
              ))}

              {remaining > 0 && (
                <button
                  type="button"
                  onClick={() => addRef.current && addRef.current.click()}
                  className="flex h-32 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition hover:border-[#3199CC] hover:text-[#3199CC]"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="mt-1 text-xs">Add image</span>
                </button>
              )}
            </div>
          )}

          <p className="mt-2 text-xs text-gray-400">
            {images.length} / {max} images
          </p>
        </>
      )}
    </div>
  );
}
