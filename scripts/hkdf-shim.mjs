// @panva/hkdf 的 workerd 打包兼容 shim（用于 nitro.alias 替换原包）
//
// 背景：next-auth（Babel 编译的 CJS）里 require('@panva/hkdf') 经 rollup 打包后，
//   解析到的是该包的 ESM/web 构建，rollup 合成的命名空间形如
//   Object.freeze({__proto__:null, default:hkdf, hkdf:hkdf})，没有 __esModule 标记。
//   Babel 的 _interopRequireDefault 对无 __esModule 的对象会再包一层
//   {default: 命名空间}，于是 next-auth 的 getDerivedEncryptionKey 调用
//   (0, x.default)('sha256', ...) 时拿到的其实是命名空间对象本身 →
//   TypeError: (0, x.default) is not a function → OAuth signin 全部报 OAuthSignin。
//   （与 mysql2 的 buffer null-proto shim 是同一类 rollup CJS 互操作问题。）
//
// 修复：本 shim 同时导出 __esModule、default、命名导出 hkdf，让 Babel 与 rollup
//   两种 interop 路径都能正确解出 hkdf 函数本体。
// 实现用 node:crypto 的 hkdfSync（Workers 上由 nodejs_compat 提供，
// 本地 Node 原生可用），签名与 @panva/hkdf 完全一致。
import { hkdfSync } from 'node:crypto'

/**
 * HKDF 密钥派生（RFC 5869），签名对齐 @panva/hkdf：
 * hkdf(digest, ikm, salt, info, keylen) → Uint8Array
 */
function hkdf(digest, ikm, salt, info, keylen) {
  // workerd 里两处坑，逐层绕开：
  //  1) node:buffer 的 Buffer 不是 realm 内 Uint8Array 实例，jose checkKeyType 拒收；
  //  2) Buffer 的迭代器在 workerd 下不可用，Uint8Array.from(buffer) 会得到空数组。
  // 因此用显式索引拷贝成纯 Uint8Array（原 @panva/hkdf web 构建返回的就是 Uint8Array）。
  const buf = hkdfSync(digest, ikm, salt, info, keylen)
  const out = new Uint8Array(keylen)
  for (let i = 0; i < keylen; i++)
    out[i] = buf[i]
  return out
}

export { hkdf }
export default hkdf
export const __esModule = true
