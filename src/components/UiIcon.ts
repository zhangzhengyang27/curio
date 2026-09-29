import { h, type FunctionalComponent } from 'vue'

/**
 * 统一 stroke 图标库：24×24 视窗、1.6 圆头描边，替代散落在各页面的 emoji 图标。
 * path 数据为组件内静态字符串，不含任何外部输入。
 */
const ICONS = {
  globe:
    '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  toolbox:
    '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  ruler:
    '<rect x="3" y="9" width="18" height="7" rx="1"/><path d="M7 9v2.5M11 9v3.5M15 9v2.5M19 9v3.5"/>',
  pencil:
    '<path d="M14.5 4.5l5 5L8 21H3v-5L14.5 4.5z"/><path d="M12.5 6.5l5 5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  wave:
    '<path d="M2 10c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/>',
  compass:
    '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
  printer:
    '<path d="M7 8V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v4"/><rect x="3" y="8" width="18" height="8" rx="2"/><rect x="7" y="13" width="10" height="8" rx="1"/>',
  target:
    '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  marquee:
    '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M10 14l4-4"/>',
  flame:
    '<path d="M12 3c2 4-3 5.5-3 9.5a3.5 3.5 0 0 0 7 0c0-1.8-.8-3-1.7-4.3-.4 1-1 1.6-1.8 1.8C13.6 8 13.5 5 12 3z"/>',
  tag: '<path d="M3 11V4a1 1 0 0 1 1-1h7l10 10-8 8L3 11z"/><circle cx="8" cy="8" r="1.4"/>',
  chart:
    '<path d="M5 20v-8M12 20V5M19 20v-11"/><path d="M3 20h18"/>',
  cyclone:
    '<path d="M4 9a8 4 0 0 1 16 1.5"/><path d="M20 15a8 4 0 0 1-16-1.5"/>',
  wind:
    '<path d="M3 8h9.5a2.5 2.5 0 1 0-2.5-2.5M3 12h13.5a2.5 2.5 0 1 1-2.5 2.5M3 16h7a2 2 0 1 1-2 2"/>',
  plane:
    '<path d="M21 3L3 10.5l6 2.5M21 3l-6 18-3.5-7.5L21 3z"/>',
  radio:
    '<circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5"/>',
  banknote:
    '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  users:
    '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5a3.5 3.5 0 0 1 0 7M17 14.5a6.5 6.5 0 0 1 4.5 5.5"/>',
  factory:
    '<path d="M3 21V8.5l6 3.75V8.5l6 3.75V4.5H21V21H3z"/>',
  trade:
    '<path d="M4 7h13l-3-3M20 17H7l3 3"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h13l-2.5 4L18 12H5"/>',
  pin: '<path d="M12 21s-6.5-5.4-6.5-10a6.5 6.5 0 0 1 13 0c0 4.6-6.5 10-6.5 10z"/><circle cx="12" cy="11" r="2.3"/>',
  bulb:
    '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 1 3.5 10.9c-.8.6-1.5 1.6-1.5 2.6h-4c0-1-.7-2-1.5-2.6A6 6 0 0 1 12 3z"/>',
  activity:
    '<path d="M3 12h4l2.5-7 5 14 2.5-7h4"/>',
  layers:
    '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  hex: '<path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9L12 3z"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  ripple:
    '<circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="9.5"/>',
  link: '<path d="M9.5 14.5l5-5"/><path d="M11 6.5L12.5 5a4 4 0 0 1 5.7 5.7L16.5 12.4"/><path d="M13 17.5L11.5 19a4 4 0 0 1-5.7-5.7l1.7-1.8"/>',
  download:
    '<path d="M12 3v11M7.5 10.5L12 15l4.5-4.5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  play: '<path d="M8 5.5v13l10.5-6.5L8 5.5z"/>',
  pause: '<path d="M9 5.5v13M15 5.5v13"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="1.5"/>',
  skip: '<path d="M6 5.5v13l8.5-6.5L6 5.5z"/><path d="M17.5 5.5v13"/>',
  rewind: '<path d="M11 6.5v11L3.5 12L11 6.5z"/><path d="M20.5 6.5v11L13 12l7.5-5.5z"/>',
  camera:
    '<path d="M4 8h3l2-2.5h6L17 8h3a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V9.5A1.5 1.5 0 0 1 4 8z"/><circle cx="12" cy="13.5" r="3.5"/>',
  satellite:
    '<rect x="9.5" y="3" width="5" height="7" rx="1" transform="rotate(35 12 6.5)"/><path d="M6 14l4 4"/><path d="M4.5 19.5l2-2M14 13l4-4"/>',
  cloud:
    '<path d="M7 18a4.5 4.5 0 1 1 .8-8.9A6 6 0 0 1 19 11a3.5 3.5 0 0 1-.5 7H7z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  contrast:
    '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18V3z" fill="currentColor" stroke="none"/>',
  sparkle:
    '<path d="M12 4l1.8 4.7 4.7 1.8-4.7 1.8L12 17l-1.8-4.7L5.5 10.5l4.7-1.8L12 4z"/><path d="M18.5 16.5l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3z"/>',
  file: '<path d="M6 3h8l4 4v14H6V3z"/><path d="M14 3v4h4"/>',
  'chevron-down': '<path d="M6 9l6 6 6-6"/>',
  search:
    '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  alert:
    '<path d="M12 3.5 21.5 20h-19L12 3.5z"/><path d="M12 10v4.5M12 17.5h.01"/>',
} as const

export type UiIconName = keyof typeof ICONS

interface UiIconProps {
  name: UiIconName
  size?: number
  strokeWidth?: number
}

const UiIcon: FunctionalComponent<UiIconProps> = props =>
  h('svg', {
    width: props.size ?? 20,
    height: props.size ?? 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': props.strokeWidth ?? 1.6,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    innerHTML: ICONS[props.name],
  })

export default UiIcon
