// 把 src/assets/photos/ 底下所有圖片建成索引，給 <Image /> 用
const modules = import.meta.glob('../assets/photos/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
  eager: true,
});

export function photoAsset(productId, filename) {
  const mod = modules[`../assets/photos/${productId}/${filename}`];
  if (!mod) throw new Error(`找不到照片：src/assets/photos/${productId}/${filename}`);
  return mod.default;
}
