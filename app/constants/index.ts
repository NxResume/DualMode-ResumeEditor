export const appName = 'Resume Editor'
export const appDescription = 'Resume Editor'

export const fontList = [
  {
    name: '默认字体',
    value: 'default',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif, \'Apple Color Emoji\', \'Segoe UI Emoji\', \'Segoe UI Symbol\', \'Noto Color Emoji',
  },
  {
    name: 'Work Sans',
    value: 'Work-Sans',
    assets: '/assets/preview-fonts/Work-Sans.woff2',
  },
  {
    name: '苹果方正',
    value: 'PingFang-Medium-sub',
    assets: '/assets/preview-fonts/PingFang-Medium-sub.ttf',
  },
  {
    name: '思源黑体',
    value: 'SourceHanSansSC-Regular',
    assets: '/assets/preview-fonts/20200203-111651-935f.woff',
  },
  {
    name: 'Times New Roman',
    value: 'Times New Roman',
    assets: '/assets/preview-fonts/TimesNewRoman.ttf',
  },
  {
    name: '阿里巴巴普惠体',
    value: 'AlibabaSans-Regular',
    assets: '/assets/preview-fonts/AlibabaSans-Regular.otf',
  },
]

export const presetColors = [
  { name: '默认绿', value: 'rgb(50, 168, 82)' },
  { name: '经典蓝', value: 'rgb(59, 130, 246)' },
  { name: '优雅紫', value: 'rgb(147, 51, 234)' },
  { name: '温暖橙', value: 'rgb(249, 115, 22)' },
  { name: '活力红', value: 'rgb(239, 68, 68)' },
  { name: '沉稳灰', value: 'rgb(107, 114, 128)' },
  { name: '商务黑', value: 'rgb(17, 24, 39)' },
  { name: '清新青', value: 'rgb(6, 182, 212)' },
  { name: '浪漫粉', value: 'rgb(236, 72, 153)' },
  { name: '自然棕', value: 'rgb(180, 83, 9)' },
  { name: '深蓝', value: 'rgb(30, 58, 138)' },
  { name: '墨绿', value: 'rgb(21, 94, 117)' },
  { name: '深紫', value: 'rgb(88, 28, 135)' },
  { name: '深红', value: 'rgb(153, 27, 27)' },
  { name: '深橙', value: 'rgb(194, 65, 12)' },
  { name: '深青', value: 'rgb(15, 118, 110)' },
  { name: '深粉', value: 'rgb(157, 23, 77)' },
  { name: '深棕', value: 'rgb(120, 53, 15)' },
]

export const pagePaddingList = [
  {
    name: '16px',
    value: 16,
  },
  {
    name: '20px',
    value: 20,
  },
  {
    name: '24px',
    value: 24,
  },
  {
    name: '32px',
    value: 32,
  },
  {
    name: '36px',
    value: 36,
  },
  {
    name: '40px',
    value: 40,
  },
]

export const pageBgList = [
  { name: '背景0', value: 'default' },
  { name: '背景1', value: '/assets/preview-bg/9h7K594eFuRIDIL.png' },
  { name: '背景2', value: '/assets/preview-bg/ac4rjZzKZ7p1pUq.png' },
  { name: '背景3', value: '/assets/preview-bg/EVeU5kPnRDR5P6m.png' },
  { name: '背景4', value: '/assets/preview-bg/hErisuIeTkSldcj.png' },
  { name: '背景5', value: '/assets/preview-bg/hoquu7d0QKdLYrC.png' },
  { name: '背景6', value: '/assets/preview-bg/M2o55aU2Io7XVGs.png' },
  { name: '背景7', value: '/assets/preview-bg/m8EC8koXUGbKSMa.png' },
  { name: '背景8', value: '/assets/preview-bg/pfiKdscjwCzEad0.png' },
  { name: '背景9', value: '/assets/preview-bg/tgSlTJGYxRZHM1O.png' },
  { name: '背景10', value: '/assets/preview-bg/UES7OiZZuUuVCQ6.png' },
]

export const WysiwygTags = ['h1', 'h2', 'h3', 'p']

export type WysiwygTagsType = typeof WysiwygTags[number]
