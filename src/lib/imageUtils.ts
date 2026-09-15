export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        // Use webp or jpeg to reduce size significantly compared to png
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const ensureMultiImages = (product: any): string[] => {
  if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
    const valid = product.images.filter(Boolean);
    if (valid.length > 1) return valid;
    if (valid.length === 1) {
      const base = valid[0];
      return [
        base,
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80"
      ];
    }
  }

  const singleImg = product?.image || product?.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80";
  return [
    singleImg,
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80"
  ];
};
