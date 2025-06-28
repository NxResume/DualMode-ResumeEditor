# 双模式存储系统

本项目支持两种存储模式：**本地存储** 和 **数据库存储**，用户可以根据需要自由切换。

## 🎯 存储模式对比

| 特性           | 本地存储             | 数据库存储           |
| -------------- | -------------------- | -------------------- |
| **数据位置**   | 浏览器 localStorage  | SQLite 数据库文件    |
| **服务器要求** | 无需服务器           | 需要 Nuxt 服务器     |
| **数据同步**   | 仅限当前设备         | 支持多设备同步       |
| **数据安全**   | 依赖浏览器           | 文件系统存储         |
| **性能**       | 快速访问             | 网络请求延迟         |
| **适用场景**   | 开发测试、单设备使用 | 生产环境、多设备使用 |

## 🚀 快速开始

### 1. 环境配置

创建 `.env` 文件：

```env
DATABASE_URL="file:./prisma/dev.db"
```

### 2. 初始化数据库

```bash
# 生成 Prisma 客户端
npx prisma generate

# 创建数据库迁移
npx prisma migrate dev --name init

# 查看数据库（可选）
npx prisma studio
```

### 3. 启动开发服务器

```bash
pnpm dev
```

## 📱 使用方式

### 切换存储模式

1. 访问设置页面：`/settings`
2. 在"存储设置"部分选择存储模式
3. 系统会自动处理数据迁移

### 存储模式说明

#### 本地存储模式

- **优点**：无需服务器，数据存储在浏览器中
- **缺点**：数据仅限当前设备，清除浏览器数据会丢失
- **适用**：开发测试、单设备使用

#### 数据库存储模式

- **优点**：数据持久化，支持多设备同步
- **缺点**：需要服务器运行，有网络请求延迟
- **适用**：生产环境、多设备使用

## 🔧 技术实现

### 架构设计

```
┌─────────────────┐    ┌─────────────────┐
│  前端组件       │    │  存储管理器     │
│  (Vue)         │◄──►│  (useStorage)   │
└─────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │  存储提供者     │
                    │  (Provider)     │
                    └─────────────────┘
                                │
                    ┌─────────────────┐
                    │  本地存储       │  数据库存储
                    │  localStorage   │  SQLite
                    └─────────────────┘
```

### 核心文件

- `types/storage.d.ts` - 存储模式类型定义
- `app/composables/useStorageManager.ts` - 存储管理器
- `app/composables/providers/localStorage.ts` - 本地存储提供者
- `app/composables/providers/databaseStorage.ts` - 数据库存储提供者
- `app/components/StorageModeSwitcher.vue` - 存储模式切换组件
- `server/api/` - 数据库 API 接口
- `prisma/schema.prisma` - 数据库模型

### 数据迁移

当用户切换存储模式时，系统会自动迁移数据：

1. **本地 → 数据库**：将 localStorage 数据导入 SQLite
2. **数据库 → 本地**：将数据库数据导出到 localStorage

## 🛠️ 开发指南

### 添加新的存储提供者

1. 实现 `IStorageProvider` 接口
2. 在 `useStorageManager` 中注册新提供者
3. 更新存储模式切换组件

### 扩展数据模型

1. 修改 `prisma/schema.prisma`
2. 运行 `npx prisma migrate dev`
3. 更新类型定义和 API 接口

### 自定义存储逻辑

```typescript
// 创建自定义存储提供者
export class CustomStorageProvider implements IStorageProvider {
  // 实现接口方法
}

// 在存储管理器中注册
const customProvider = new CustomStorageProvider()
```

## 🔍 故障排除

### 数据库连接失败

1. 检查 `.env` 文件中的 `DATABASE_URL`
2. 确保已运行 `npx prisma generate`
3. 检查数据库文件权限

### 数据迁移失败

1. 检查网络连接
2. 查看浏览器控制台错误
3. 检查服务器日志

### 存储模式切换失败

1. 检查 localStorage 权限
2. 确保数据库服务正常运行
3. 查看错误信息并重试

## 📝 注意事项

1. **数据备份**：建议定期备份重要数据
2. **浏览器兼容性**：本地存储依赖浏览器支持
3. **数据大小限制**：localStorage 有存储大小限制
4. **并发访问**：数据库模式支持多用户并发访问

## 🚀 未来计划

- [ ] 支持更多数据库类型（PostgreSQL、MySQL）
- [ ] 添加数据加密功能
- [ ] 实现自动备份功能
- [ ] 支持云端同步
- [ ] 添加数据导入/导出功能
