import { useScroll } from '@vueuse/core'
import { watchEffect } from 'vue'

export function useScrollSync(leftRef: Ref<any>, rightRef: Ref<any>) {
  // 获取左边和右边元素的滚动位置
  const { y: leftScrollY } = useScroll(leftRef)
  const { y: rightScrollY } = useScroll(rightRef)

  // 监听左边编辑器的滚动，更新右边预览的滚动位置
  watchEffect(() => {
    if (leftRef.value && rightRef.value) {
      const leftHeight = leftRef.value.scrollHeight
      const rightHeight = rightRef.value.scrollHeight
      const scrollRatio = leftScrollY.value / leftHeight

      // 更新右边预览的滚动位置
      rightRef.value.scrollTop = scrollRatio * rightHeight
    }
  })

  // 监听右边预览的滚动，更新左边编辑器的滚动位置
  watchEffect(() => {
    if (leftRef.value && rightRef.value) {
      const leftHeight = leftRef.value.scrollHeight
      const rightHeight = rightRef.value.scrollHeight
      const scrollRatio = rightScrollY.value / rightHeight

      // 更新左边编辑器的滚动位置
      leftRef.value.scrollTop = scrollRatio * leftHeight
    }
  })
}
