/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! CẢNH BÁO !!
    // Chỉ dùng cái này nếu bạn không thể fix được lỗi build.
    // Nó sẽ cho phép build thành công ngay cả khi có lỗi Type.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Tương tự cho ESLint nếu cần
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig