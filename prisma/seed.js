const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Đang bắt đầu seed dữ liệu...')

  // 1. Seed Categories
  const categories = [
    // THU
    { name: 'Lương', type: 'THU', icon: '💼', color: '#10b981' },
    { name: 'Thưởng', type: 'THU', icon: '🎁', color: '#f59e0b' },
    { name: 'Đầu tư', type: 'THU', icon: '📈', color: '#3b82f6' },
    { name: 'Kinh doanh', type: 'THU', icon: '🏪', color: '#8b5cf6' },
    { name: 'Khác (thu)', type: 'THU', icon: '➕', color: '#06b6d4' },
    // CHI
    { name: 'Ăn uống', type: 'CHI', icon: '🍜', color: '#ef4444' },
    { name: 'Di chuyển', type: 'CHI', icon: '🚗', color: '#f97316' },
    { name: 'Nhà cửa', type: 'CHI', icon: '🏠', color: '#ec4899' },
    { name: 'Sức khỏe', type: 'CHI', icon: '🏥', color: '#14b8a6' },
    { name: 'Giáo dục', type: 'CHI', icon: '📚', color: '#6366f1' },
    { name: 'Mua sắm', type: 'CHI', icon: '🛍️', color: '#f43f5e' },
    { name: 'Giải trí', type: 'CHI', icon: '🎮', color: '#a855f7' },
    { name: 'Tiết kiệm', type: 'CHI', icon: '🏦', color: '#0ea5e9' },
    { name: 'Khác (chi)', type: 'CHI', icon: '➖', color: '#78716c' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name }, // Dùng 'name' vì nó là @unique trong schema
      update: {},
      create: cat,
    })
  }
  console.log(`✅ Đã tạo/cập nhật ${categories.length} danh mục.`)

  // 2. Seed Users
  const salt = await bcrypt.genSalt(10)
  const pw = await bcrypt.hash('123456', salt)
  
  const users = [
    { name: 'Bố', email: 'bo@family.com', passwordHash: pw, role: 'ADMIN' },
    { name: 'Mẹ', email: 'me@family.com', passwordHash: pw, role: 'MEMBER' },
    { name: 'Con', email: 'con@family.com', passwordHash: pw, role: 'MEMBER' },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    })
  }
  console.log(`✅ Đã tạo/cập nhật ${users.length} người dùng.`)
  
  console.log('🚀 Hoàn tất quá trình Seed!')
}

main()
  .catch((e) => {
    console.error('❌ Lỗi Seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })