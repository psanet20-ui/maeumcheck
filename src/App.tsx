import { useEffect, useMemo, useState } from 'react'
import './App.css'

type MoodWeather = '맑음' | '흐림' | '비' | '폭우' | '갬'
type OnboardingFeeling = '괜찮아요' | '조금 지쳤어요' | '많이 힘들어요'
type AppTab = 'check' | 'guide'
type RecoveryCategory =
  | 'sleep'
  | 'calm'
  | 'energy'
  | 'relationship'
  | 'burnout'

type DiaryState = {
  emotionTag: string
  hardThingTag: string
  gratitudeTag: string
  note: string
}

type Entry = {
  id: string
  date: string
  score: number
  mood: MoodWeather
  answers: number[]
  diary: DiaryState
}

type KakaoShareStatus = 'idle' | 'loading' | 'ready' | 'unavailable'

type KakaoShareApi = {
  isInitialized: () => boolean
  init: (key: string) => void
  Share: {
    sendDefault: (settings: {
      objectType: 'text'
      text: string
      link: {
        mobileWebUrl: string
        webUrl: string
      }
      buttonTitle: string
    }) => void
  }
}

type LegacyDiaryState = Partial<DiaryState> & {
  feeling?: string
  hardThing?: string
  gratitude?: string
}

type RecoveryGuide = {
  category: RecoveryCategory
  kicker: string
  title: string
  icon: string
  summary: string
  when: string
  steps: string[]
  note: string
}

declare global {
  interface Window {
    Kakao?: KakaoShareApi
  }
}

const QUESTIONS = [
  '일을 하는 것에 대한 흥미나 재미가 거의 없음',
  '기분이 가라앉거나, 우울하거나, 희망이 없음',
  '잠들기 어렵거나 자주 깨어남, 혹은 너무 많이 잠',
  '피곤하다고 느끼거나 기운이 거의 없음',
  '입맛이 없거나 과식함',
  '자신을 부정적으로 봄, 혹은 자신이 실패자라고 느낌',
  '신문을 읽거나 TV를 보는 것처럼 집중하기가 어려움',
  '남이 알아챌 정도로 느리게 움직이거나, 안절부절못함',
  '차라리 죽는 것이 낫겠다고 생각하거나 자신을 해칠 생각을 함',
] as const

const ANXIETY_QUESTIONS = [
  '긴장되거나, 불안하거나, 초조하다고 느낌',
  '걱정을 멈추거나 조절하기 어려움',
  '여러 가지 걱정을 너무 많이 함',
  '편안하게 쉬기가 어려움',
  '안절부절못해서 가만히 있기 어려움',
  '쉽게 짜증이 나거나 예민해짐',
  '마치 끔찍한 일이 생길 것처럼 두려움',
] as const

const STRESS_QUESTIONS = [
  '해야 할 일이 한꺼번에 몰려 마음이 바쁘게 느껴짐',
  '쉬는 시간에도 몸이나 생각이 긴장된 느낌이 남아 있음',
  '작은 일에도 쉽게 지치거나 예민해짐',
  '하루가 끝나면 머리가 과하게 복잡하거나 소진된 느낌이 듦',
  '잠깐 쉬어도 다시 힘이 차오르지 않는 느낌이 있음',
  '관계나 일 때문에 마음이 눌리는 날이 많아짐',
] as const

const OPTIONS = [
  { value: 0, label: '전혀' },
  { value: 1, label: '가끔' },
  { value: 2, label: '며칠' },
  { value: 3, label: '자주' },
  { value: 4, label: '거의 매일' },
] as const

const WEATHER_OPTIONS: { label: MoodWeather; emoji: string }[] = [
  { label: '맑음', emoji: '☀' },
  { label: '흐림', emoji: '⛅' },
  { label: '비', emoji: '🌧' },
  { label: '폭우', emoji: '⛈' },
  { label: '갬', emoji: '🌈' },
]

const ONBOARDING_OPTIONS: {
  value: OnboardingFeeling
  mood: MoodWeather
  summary: string
}[] = [
  {
    value: '괜찮아요',
    mood: '맑음',
    summary: '가볍게 오늘 마음을 살펴보고 필요한 회복 미션만 챙겨볼게요.',
  },
  {
    value: '조금 지쳤어요',
    mood: '흐림',
    summary: '천천히 시작해도 괜찮아요. 지금 마음에 맞춰 부담 없이 이어갈게요.',
  },
  {
    value: '많이 힘들어요',
    mood: '비',
    summary: '지금은 버티는 것만으로도 충분해요. 무겁지 않게 한 걸음씩 같이 볼게요.',
  },
]

const EMOTION_TAGS = ['무기력', '불안', '외로움', '답답함', '지침', '괜찮음'] as const
const HARD_THING_TAGS = ['관계', '일/공부', '건강', '수면', '미래 걱정', '없음'] as const
const GRATITUDE_TAGS = [
  '식사',
  '휴식',
  '가족',
  '친구',
  '햇빛',
  '산책',
  '음악',
  '따뜻한 말',
  '작은 성취',
  '지금은 잘 모르겠어요',
] as const

const COMFORT_CARDS = [
  '오늘도 여기까지 온 당신은 충분히 잘하고 있습니다.',
  '꽃이 피지 않는 날에도 뿌리는 자라고 있습니다.',
  '지금 필요한 것은 채찍보다 숨 한 번 고르는 시간일 수 있습니다.',
  '완벽하지 않아도 괜찮습니다. 오늘을 버틴 것만으로도 의미가 있습니다.',
  '마음이 흐린 날에는 속도를 늦추는 것도 용기입니다.',
]

const RECOVERY_GUIDES: RecoveryGuide[] = [
  {
    category: 'sleep',
    kicker: '회복 가이드 1',
    title: '수면 회복',
    icon: '☾',
    summary: '밤을 완벽하게 바꾸기보다, 잠들기 전 몸을 쉬게 하는 작은 루틴부터 제안합니다.',
    when: '잠드는 시간이 들쑥날쑥하거나 자주 깨는 날이 이어질 때',
    steps: [
      '잠들기 30분 전 화면 밝기와 소리를 줄여 보기',
      '누워서 해야 할 일 정리 대신, 메모 한 줄로 밖에 꺼내 두기',
      '잠이 바로 오지 않아도 몸을 쉬게 하는 시간이라고 생각해 보기',
    ],
    note: '잠을 잘 자야 한다는 압박보다, 몸을 쉬게 하는 준비에 집중해 보세요.',
  },
  {
    category: 'calm',
    kicker: '회복 가이드 2',
    title: '불안 진정',
    icon: '〰',
    summary: '불안을 없애기보다, 올라오는 속도를 조금 늦추는 생활 회복 팁을 담았습니다.',
    when: '걱정이 꼬리를 물고 이어지거나 몸이 자주 긴장될 때',
    steps: [
      '숨을 크게 바꾸기보다 내쉬는 시간을 조금 더 길게 가져가기',
      '걱정이 많을 때는 한 번에 해결하지 말고 오늘 다룰 한 가지를 정하기',
      '혼자 정리되지 않으면 믿을 사람에게 지금 마음이 분주하다고 먼저 말하기',
    ],
    note: '불안이 올라오는 날에는 해결보다 안정이 먼저일 수 있습니다.',
  },
  {
    category: 'energy',
    kicker: '회복 가이드 3',
    title: '무기력 회복',
    icon: '☀',
    summary: '의욕을 끌어올리기보다, 움직일 수 있는 최소 단위를 찾는 회복 방식입니다.',
    when: '아무것도 하기 싫고 시작이 유난히 무겁게 느껴질 때',
    steps: [
      '할 일을 끝내는 목표보다 5분만 손대는 목표로 바꾸기',
      '샤워, 물 한 잔, 창문 열기처럼 몸이 먼저 움직이는 선택을 하기',
      '하루 계획은 세 가지보다 한 가지를 분명하게 정하기',
    ],
    note: '무기력한 날에는 의지가 부족한 것이 아니라 에너지가 모자란 경우가 많습니다.',
  },
  {
    category: 'relationship',
    kicker: '회복 가이드 4',
    title: '관계 피로 회복',
    icon: '◌',
    summary: '사람을 피하거나 억지로 맞추는 대신, 내 경계를 회복하는 생활 제안을 담았습니다.',
    when: '대화 후 유난히 지치거나, 마음이 자주 눌리는 관계가 있을 때',
    steps: [
      '답장을 바로 하지 않아도 되는 관계는 한 템포 늦추기',
      '내가 힘든 이유를 설명하기 어려우면 지금은 쉬고 싶다고 짧게 말하기',
      '편안한 사람 한 명과는 안부를 끊지 않도록 작은 연결 유지하기',
    ],
    note: '관계를 줄이는 것보다, 나를 덜 소모시키는 방식으로 조절하는 것이 목표입니다.',
  },
  {
    category: 'burnout',
    kicker: '회복 가이드 5',
    title: '번아웃 회복',
    icon: '✳',
    summary: '지친 상태에서 더 밀어붙이기보다, 소모를 줄이고 회복 여백을 만드는 쪽에 가깝습니다.',
    when: '해야 할 일은 남아 있는데 마음과 몸이 동시에 바닥난 느낌일 때',
    steps: [
      '오늘 꼭 해야 하는 일과 미뤄도 되는 일을 나눠 보기',
      '성과를 내는 시간 말고 비워 두는 시간을 일정에 먼저 넣기',
      '하루를 버틴 나를 평가하기보다, 소모된 부분을 먼저 살펴보기',
    ],
    note: '번아웃 회복은 더 열심히 하는 것이 아니라 덜 소모되는 구조를 찾는 일입니다.',
  },
]

const STORAGE_KEY = 'mind-check-app-v1'
const KAKAO_SDK_URL = 'https://developers.kakao.com/sdk/js/kakao.js'
const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY
const SHARE_URL = import.meta.env.VITE_APP_SHARE_URL

const createEmptyAnswers = () => Array(QUESTIONS.length).fill(0)
const createEmptyAnxietyAnswers = () => Array(ANXIETY_QUESTIONS.length).fill(0)
const createEmptyStressAnswers = () => Array(STRESS_QUESTIONS.length).fill(0)
const createEmptyDiary = (): DiaryState => ({
  emotionTag: '',
  hardThingTag: '',
  gratitudeTag: '',
  note: '',
})

function createEntryId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function normalizeDiary(diary: LegacyDiaryState | undefined): DiaryState {
  if (!diary) {
    return createEmptyDiary()
  }

  return {
    emotionTag: diary.emotionTag ?? diary.feeling ?? '',
    hardThingTag: diary.hardThingTag ?? diary.hardThing ?? '',
    gratitudeTag: diary.gratitudeTag ?? diary.gratitude ?? '',
    note: diary.note ?? '',
  }
}

function loadSavedState() {
  if (typeof window === 'undefined') {
    return {
      entries: [] as Entry[],
      cardIndex: 0,
    }
  }

  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) {
    return {
      entries: [] as Entry[],
      cardIndex: 0,
    }
  }

  try {
    const parsed = JSON.parse(saved) as {
      entries?: Array<
        Omit<Entry, 'id' | 'diary'> & {
          id?: string
          diary?: Entry['diary'] & {
            feeling?: string
            hardThing?: string
            gratitude?: string
          }
        }
      >
      cardIndex?: number
    }

    return {
      entries:
        parsed.entries?.map((entry, index) => ({
          ...entry,
          id:
            typeof entry.id === 'string' && entry.id.length > 0
              ? entry.id
              : `legacy-${index}-${entry.date}-${entry.score}`,
          diary: normalizeDiary(entry.diary),
        })) ?? [],
      cardIndex:
        typeof parsed.cardIndex === 'number'
          ? parsed.cardIndex % COMFORT_CARDS.length
          : 0,
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return {
      entries: [] as Entry[],
      cardIndex: 0,
    }
  }
}

const getToday = () =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date())

function getSeverity(score: number) {
  if (score <= 5) {
    return {
      label: '안정권',
      summary: '지금은 비교적 안정적인 마음 상태로 보입니다.',
      color: 'stable',
    }
  }
  if (score <= 12) {
    return {
      label: '가벼운 우울감',
      summary: '조금 지친 신호가 보입니다. 일상 회복 루틴이 도움이 될 수 있습니다.',
      color: 'mild',
    }
  }
  if (score <= 19) {
    return {
      label: '중간 정도 우울감',
      summary: '기분 저하가 일상에 영향을 주고 있을 수 있습니다.',
      color: 'moderate',
    }
  }
  if (score <= 26) {
    return {
      label: '높은 우울감',
      summary:
        '혼자 버티기보다 가까운 사람이나 전문가와 연결이 필요할 수 있습니다.',
      color: 'high',
    }
  }
  return {
    label: '매우 높은 우울감',
    summary:
      '빠른 도움 연결이 중요해 보입니다. 지금은 혼자 견디지 않는 것이 우선입니다.',
    color: 'critical',
  }
}

function getMindType(score: number) {
  if (score <= 5) return '회복 준비형'
  if (score <= 12) return '가벼운 지침형'
  if (score <= 19) return '번아웃 주의형'
  if (score <= 26) return '위로 연결형'
  return '도움 요청형'
}

function getMission(score: number) {
  if (score <= 5) return ['감사한 일 1가지 적기', '햇빛 10분 쬐기', '오늘 나를 칭찬하는 한마디']
  if (score <= 12) return ['물 한 잔 마시기', '창문 열고 깊게 숨 쉬기', '가벼운 산책 10분']
  if (score <= 19) return ['식사 거르지 않기', '믿을 사람에게 안부 보내기', '오늘 해야 할 일 1개만 정하기']
  if (score <= 26) return ['샤워하고 몸 돌보기', '혼자 있지 않기', '가까운 사람에게 현재 상태 알리기']
  return [
    '지금 바로 주변 사람에게 연락하기',
    '109 또는 1577-0199 도움 정보 확인하기',
    '오늘 일정 줄이고 안전한 곳에 머물기',
  ]
}

function buildShareText(entry: Entry, card: string) {
  const severity = getSeverity(entry.score)
  return [
    '오늘의 마음체크 결과를 나눕니다.',
    `현재 마음 상태: ${severity.label} (${entry.score}점)`,
    `마음 날씨: ${entry.mood}`,
    `한 줄 위로: ${card}`,
    '',
    '해결책보다 안부 한마디가 힘이 될 수 있습니다.',
  ].join('\n')
}

function getShareUrl() {
  if (SHARE_URL) {
    return SHARE_URL
  }
  if (typeof window !== 'undefined') {
    return window.location.href
  }
  return 'https://example.com'
}

function getMindHouse(score: number) {
  if (score <= 5) {
    return {
      name: '따뜻한 집',
      emoji: '🏡',
      theme: 'house-warm',
      description: '마음의 불이 안정적으로 켜져 있습니다. 지금의 균형을 잘 지켜 보세요.',
      careTip: '감사 한 줄을 남기며 이 따뜻함을 오래 이어가 보세요.',
    }
  }
  if (score <= 12) {
    return {
      name: '정원이 있는 집',
      emoji: '🌳',
      theme: 'house-garden',
      description: '지친 흔적은 있지만 회복의 기운도 함께 남아 있습니다.',
      careTip: '햇빛, 산책, 가벼운 대화처럼 작은 회복 루틴이 잘 맞습니다.',
    }
  }
  if (score <= 19) {
    return {
      name: '난로가 있는 집',
      emoji: '🔥',
      theme: 'house-hearth',
      description: '마음이 차가워지지 않도록 안쪽에서 열을 지켜야 하는 시기입니다.',
      careTip: '몸을 돌보고, 일정 하나를 줄이며, 쉴 자리를 먼저 만들어 주세요.',
    }
  }
  if (score <= 26) {
    return {
      name: '비 내리는 집',
      emoji: '🌧',
      theme: 'house-rain',
      description: '마음의 지붕 위로 비가 내리고 있습니다. 혼자 견디기 버거울 수 있습니다.',
      careTip: '가까운 사람에게 현재 상태를 알리고 우산이 되어 달라고 요청해 보세요.',
    }
  }
  return {
    name: '창문이 닫힌 집',
    emoji: '🏚',
    theme: 'house-closed',
    description: '마음의 집이 많이 지쳐 있습니다. 지금은 빠른 도움 연결이 가장 중요합니다.',
    careTip: '109, 1577-0199 또는 믿을 수 있는 사람에게 바로 연결해 안전을 먼저 확보해 주세요.',
  }
}

function getAnxietySeverity(score: number) {
  if (score <= 4) {
    return {
      label: '안정권',
      summary: '현재는 불안 신호가 비교적 크지 않은 편으로 보입니다.',
      color: 'stable',
    }
  }
  if (score <= 9) {
    return {
      label: '가벼운 불안',
      summary: '걱정이 조금 많아진 시기일 수 있습니다. 숨을 고르는 루틴이 도움이 됩니다.',
      color: 'mild',
    }
  }
  if (score <= 15) {
    return {
      label: '중간 정도 불안',
      summary: '걱정과 긴장이 일상에 영향을 주고 있을 수 있습니다.',
      color: 'moderate',
    }
  }
  return {
    label: '높은 불안',
    summary: '불안이 자주 올라오는 상태일 수 있어 가까운 도움과 안정 루틴이 필요해 보입니다.',
    color: 'high',
  }
}

function getAnxietyTips(score: number) {
  if (score <= 4) return ['지금처럼 숨을 고르는 시간을 유지하기', '잠들기 전 휴대폰 10분 줄이기']
  if (score <= 9) return ['어깨 힘 풀고 천천히 3번 숨 쉬기', '걱정되는 일을 메모로 꺼내 보기']
  if (score <= 15) return ['오늘 꼭 할 일 1개만 정하기', '믿을 사람에게 걱정이 많다고 알리기']
  return ['혼자 버티지 말고 가까운 사람에게 현재 상태 말하기', '필요하면 전문가 도움 연결을 함께 알아보기']
}

function getStressSeverity(score: number) {
  if (score <= 5) {
    return {
      label: '부담이 크지 않은 편',
      summary: '현재는 생활 스트레스가 비교적 감당 가능한 범위에 있는 것으로 보입니다.',
      color: 'stable',
    }
  }
  if (score <= 11) {
    return {
      label: '조금 쌓인 상태',
      summary: '긴장과 피로가 천천히 쌓이고 있을 수 있어 쉬는 방식 점검이 도움 됩니다.',
      color: 'mild',
    }
  }
  if (score <= 17) {
    return {
      label: '회복이 필요한 상태',
      summary: '생활 스트레스가 일상 컨디션에 영향을 주고 있을 가능성이 있습니다.',
      color: 'moderate',
    }
  }
  return {
    label: '소모가 큰 상태',
    summary: '지금은 버티는 힘보다 회복 여백을 만드는 쪽이 더 중요해 보입니다.',
    color: 'high',
  }
}

function getStressTips(score: number) {
  if (score <= 5) return ['지금의 휴식 루틴을 유지하기', '하루 끝 10분은 아무 일정도 넣지 않기']
  if (score <= 11) return ['쉬는 시간에도 일을 붙들지 않도록 메모로 내려놓기', '오늘 일정 하나만 덜어내기']
  if (score <= 17) return ['하루 중 회복되는 시간대를 정해 미리 비워두기', '해야 할 일 우선순위를 1~2개로 줄이기']
  return ['계속 버티기보다 도움을 요청할 사람과 오늘 안에 연결하기', '회복 가이드 탭에서 번아웃·수면 회복부터 먼저 보기']
}

function getRecoveryRecommendations({
  score,
  anxietyScore,
  stressScore,
  answers,
  diary,
}: {
  score: number
  anxietyScore: number
  stressScore: number
  answers: number[]
  diary: DiaryState
}) {
  const weights: Record<RecoveryCategory, number> = {
    sleep: 0,
    calm: 0,
    energy: 0,
    relationship: 0,
    burnout: 0,
  }

  if (score >= 12) {
    weights.energy += 2
    weights.burnout += 1
  }
  if (score >= 19) {
    weights.burnout += 2
  }
  if (anxietyScore >= 9) {
    weights.calm += 3
    weights.sleep += 1
  }
  if (anxietyScore >= 15) {
    weights.calm += 2
  }
  if (stressScore >= 8) {
    weights.burnout += 2
    weights.calm += 1
  }
  if (stressScore >= 14) {
    weights.burnout += 2
    weights.sleep += 1
  }
  if (answers[2] >= 2) {
    weights.sleep += 3
  }
  if (answers[3] >= 2) {
    weights.energy += 2
  }
  if (diary.emotionTag === '무기력') {
    weights.energy += 2
  }
  if (diary.emotionTag === '불안') {
    weights.calm += 2
  }
  if (diary.hardThingTag === '수면') {
    weights.sleep += 3
  }
  if (diary.hardThingTag === '관계') {
    weights.relationship += 3
  }
  if (diary.hardThingTag === '일/공부') {
    weights.burnout += 2
  }
  if (diary.hardThingTag === '미래 걱정') {
    weights.calm += 2
  }

  const ranked = [...RECOVERY_GUIDES].sort(
    (a, b) => weights[b.category] - weights[a.category],
  )

  const topWeight = weights[ranked[0].category]
  if (topWeight <= 0) {
    return RECOVERY_GUIDES.slice(0, 3)
  }

  return ranked.slice(0, 3)
}

function App() {
  const savedState = loadSavedState()
  const [hasStartedCheck, setHasStartedCheck] = useState(false)
  const [activeTab, setActiveTab] = useState<AppTab>('check')
  const [hasViewedResults, setHasViewedResults] = useState(false)
  const [anxietyInterest, setAnxietyInterest] = useState<'idle' | 'yes' | 'later'>('idle')
  const [stressInterest, setStressInterest] = useState<'idle' | 'yes' | 'later'>('idle')
  const [anxietyAnswers, setAnxietyAnswers] = useState<number[]>(createEmptyAnxietyAnswers)
  const [stressAnswers, setStressAnswers] = useState<number[]>(createEmptyStressAnswers)
  const [hasViewedAnxietyResults, setHasViewedAnxietyResults] = useState(false)
  const [hasViewedStressResults, setHasViewedStressResults] = useState(false)
  const [onboardingFeeling, setOnboardingFeeling] =
    useState<OnboardingFeeling>('조금 지쳤어요')
  const [answers, setAnswers] = useState<number[]>(createEmptyAnswers)
  const [mood, setMood] = useState<MoodWeather>('흐림')
  const [diary, setDiary] = useState<DiaryState>(createEmptyDiary)
  const [entries, setEntries] = useState<Entry[]>(savedState.entries)
  const [cardIndex, setCardIndex] = useState(savedState.cardIndex)
  const [shareMessage, setShareMessage] = useState('')
  const [selectedDate, setSelectedDate] = useState('all')
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
    savedState.entries[0]?.id ?? null,
  )
  const [kakaoShareStatus, setKakaoShareStatus] =
    useState<KakaoShareStatus>(KAKAO_JS_KEY ? 'loading' : 'unavailable')

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        entries,
        cardIndex,
      }),
    )
  }, [entries, cardIndex])

  useEffect(() => {
    if (!KAKAO_JS_KEY) return

    const initializeKakao = () => {
      const kakao = window.Kakao
      if (!kakao) {
        setKakaoShareStatus('unavailable')
        return
      }
      if (!kakao.isInitialized()) {
        kakao.init(KAKAO_JS_KEY)
      }
      setKakaoShareStatus('ready')
    }

    if (window.Kakao) {
      queueMicrotask(initializeKakao)
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${KAKAO_SDK_URL}"]`,
    )

    if (existingScript) {
      existingScript.addEventListener('load', initializeKakao, { once: true })
      existingScript.addEventListener(
        'error',
        () => setKakaoShareStatus('unavailable'),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.src = KAKAO_SDK_URL
    script.async = true
    script.onload = initializeKakao
    script.onerror = () => setKakaoShareStatus('unavailable')
    document.head.appendChild(script)

    return () => {
      script.onload = null
      script.onerror = null
    }
  }, [])

  const score = useMemo(
    () => answers.reduce((total, current) => total + current, 0),
    [answers],
  )
  const anxietyScore = useMemo(
    () => anxietyAnswers.reduce((total, current) => total + current, 0),
    [anxietyAnswers],
  )
  const stressScore = useMemo(
    () => stressAnswers.reduce((total, current) => total + current, 0),
    [stressAnswers],
  )

  const severity = getSeverity(score)
  const anxietySeverity = getAnxietySeverity(anxietyScore)
  const stressSeverity = getStressSeverity(stressScore)
  const anxietyTips = getAnxietyTips(anxietyScore)
  const stressTips = getStressTips(stressScore)
  const missions = getMission(score)
  const comfortCard = COMFORT_CARDS[cardIndex]
  const mindHouse = getMindHouse(score)
  const recoveryRecommendations = getRecoveryRecommendations({
    score,
    anxietyScore,
    stressScore,
    answers,
    diary,
  })
  const lastEntry = entries[0]
  const dateOptions = [...new Set(entries.map((entry) => entry.date))]
  const filteredEntries =
    selectedDate === 'all'
      ? entries
      : entries.filter((entry) => entry.date === selectedDate)
  const selectedEntry =
    filteredEntries.find((entry) => entry.id === selectedEntryId) ??
    filteredEntries[0] ??
    null
  const currentCheckDate = getToday()
  const progress =
    lastEntry && entries[1] ? Math.max(entries[1].score - lastEntry.score, 0) : 0
  const highRisk = score >= 20 || answers[8] > 0
  const chartEntries = [...entries].slice(0, 6).reverse()
  const chartMaxScore =
    chartEntries.length > 0
      ? Math.max(...chartEntries.map((entry) => entry.score), 36)
      : 36
  const chartPoints =
    chartEntries.length > 0
      ? chartEntries
          .map((entry, index) => {
            const x =
              chartEntries.length === 1
                ? 160
                : 24 + (272 / (chartEntries.length - 1)) * index
            const y = 132 - (entry.score / chartMaxScore) * 108
            return `${x},${y}`
          })
          .join(' ')
      : ''
  const chartHigh =
    chartEntries.length > 0
      ? Math.max(...chartEntries.map((entry) => entry.score))
      : 0
  const chartLow =
    chartEntries.length > 0
      ? Math.min(...chartEntries.map((entry) => entry.score))
      : 0
  const chartDelta =
    chartEntries.length > 1
      ? chartEntries[chartEntries.length - 1].score - chartEntries[0].score
      : 0

  const buildCurrentEntry = (): Entry => ({
    id: createEntryId(),
    date: getToday(),
    score,
    mood,
    answers,
    diary,
  })

  const handleAnswerChange = (questionIndex: number, value: number) => {
    setHasViewedResults(false)
    setAnswers((current) =>
      current.map((answer, index) => (index === questionIndex ? value : answer)),
    )
  }

  const handleDiaryTagChange = (field: keyof Omit<DiaryState, 'note'>, value: string) => {
    setDiary((current) => ({
      ...current,
      [field]: current[field] === value ? '' : value,
    }))
  }

  const handleStartCheck = () => {
    const selectedOption = ONBOARDING_OPTIONS.find(
      (option) => option.value === onboardingFeeling,
    )

    if (selectedOption) {
      setMood(selectedOption.mood)
    }

    setHasStartedCheck(true)
    setHasViewedResults(false)
    setActiveTab('check')
    setShareMessage('')
  }

  const handleShowResults = () => {
    setHasViewedResults(true)
  }

  const handleAnxietyAnswerChange = (questionIndex: number, value: number) => {
    setHasViewedAnxietyResults(false)
    setAnxietyAnswers((current) =>
      current.map((answer, index) => (index === questionIndex ? value : answer)),
    )
  }

  const handleStressAnswerChange = (questionIndex: number, value: number) => {
    setHasViewedStressResults(false)
    setStressAnswers((current) =>
      current.map((answer, index) => (index === questionIndex ? value : answer)),
    )
  }

  const handleShowAnxietyResults = () => {
    setHasViewedAnxietyResults(true)
  }

  const handleShowStressResults = () => {
    setHasViewedStressResults(true)
  }

  const handleSave = () => {
    const entry = buildCurrentEntry()
    setEntries((current) => [entry, ...current].slice(0, 12))
    setSelectedDate('all')
    setSelectedEntryId(entry.id)
    setShareMessage('오늘 기록이 저장되었습니다.')
  }

  const handleDeleteEntry = (entryId: string) => {
    setEntries((current) => {
      const nextEntries = current.filter((entry) => entry.id !== entryId)

      if (selectedEntryId === entryId) {
        setSelectedEntryId(nextEntries[0]?.id ?? null)
      }

      if (
        selectedDate !== 'all' &&
        !nextEntries.some((entry) => entry.date === selectedDate)
      ) {
        setSelectedDate('all')
      }

      return nextEntries
    })
    setShareMessage('기록을 삭제했습니다.')
  }

  const handleGeneralShare = async () => {
    const entry = buildCurrentEntry()
    const text = buildShareText(entry, comfortCard)

    try {
      if (navigator.share) {
        await navigator.share({
          title: '오늘의 마음체크',
          text,
          url: getShareUrl(),
        })
        setShareMessage('공유 창을 열었습니다.')
        return
      }

      await navigator.clipboard.writeText(text)
      setShareMessage('공유 문구를 클립보드에 복사했습니다.')
    } catch {
      setShareMessage('공유는 열지 못했지만, 다시 시도할 수 있습니다.')
    }
  }

  const handleKakaoShare = () => {
    if (kakaoShareStatus !== 'ready' || !window.Kakao) {
      setShareMessage('카카오 공유 설정이 아직 준비되지 않았습니다.')
      return
    }

    const entry = buildCurrentEntry()
    const text = buildShareText(entry, comfortCard)
    const shareUrl = getShareUrl()

    try {
      window.Kakao.Share.sendDefault({
        objectType: 'text',
        text,
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
        buttonTitle: '마음체크 보기',
      })
      setShareMessage('카카오톡 공유 창을 열었습니다.')
    } catch {
      setShareMessage('카카오톡 공유를 열지 못했습니다. 키 설정을 확인해 주세요.')
    }
  }

  const rotateCard = () => {
    setCardIndex((current) => (current + 1) % COMFORT_CARDS.length)
    setShareMessage('')
  }

  const kakaoButtonLabel =
    kakaoShareStatus === 'loading'
      ? '카카오 준비 중'
      : kakaoShareStatus === 'ready'
        ? '카카오톡 공유'
        : '카카오 키 필요'

  return (
    <main className="app-shell">
      {!hasStartedCheck ? (
        <section className="onboarding-panel">
          <div className="onboarding-copy">
            <p className="eyebrow">가볍게 시작하는 첫 화면</p>
            <h1>괜찮은 척하고 있지는 않나요?</h1>
            <p className="hero-text">
              우울, 불안, 스트레스를 가볍게 자가점검하고 지금 내게 맞는 생활 회복 힌트를
              찾아볼 수 있어요.
            </p>
            <div className="onboarding-choice-group">
              {ONBOARDING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`onboarding-choice${
                    onboardingFeeling === option.value ? ' active' : ''
                  }`}
                  onClick={() => setOnboardingFeeling(option.value)}
                >
                  <strong>{option.value}</strong>
                  <span>{option.summary}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="primary-button onboarding-start"
              onClick={handleStartCheck}
            >
              마음 체크 시작
            </button>
          </div>
        </section>
      ) : null}

      {hasStartedCheck ? (
        <nav className="app-nav" aria-label="앱 메뉴">
          <button
            type="button"
            className={activeTab === 'check' ? 'app-nav-item active' : 'app-nav-item'}
            onClick={() => setActiveTab('check')}
          >
            마음 체크
          </button>
          <button
            type="button"
            className={activeTab === 'guide' ? 'app-nav-item active' : 'app-nav-item'}
            onClick={() => setActiveTab('guide')}
          >
            회복 가이드
            {hasViewedResults ? <span className="nav-badge">추천</span> : null}
          </button>
        </nav>
      ) : null}

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">자가점검 · 생활 회복 가이드</p>
          <h1>마음체크</h1>
          <p className="hero-text">
            우울, 불안, 스트레스를 가볍게 자가점검하고 지금의 나에게 맞는 생활 회복
            가이드를 살펴보는 공간입니다. 진단이나 치료가 아니라, 내 상태를 알아차리고
            작은 회복 선택을 돕는 데 초점을 둡니다.
          </p>
          <div className="hero-badges">
            <span>PHQ-9 참고</span>
            <span>GAD-7 참고</span>
            <span>생활 스트레스 체크</span>
            <span>회복 가이드 추천</span>
          </div>
        </div>

        <div className={`score-card ${severity.color}`}>
          {hasViewedResults ? (
            <>
              <p className="score-label">오늘의 마음 점수</p>
              <strong>{score}점</strong>
              <p className="score-title">{severity.label}</p>
              <p className="score-summary">{severity.summary}</p>
              <div className="score-meta">
                <span>마음 유형: {getMindType(score)}</span>
                <span>마음 날씨: {mood}</span>
              </div>
            </>
          ) : (
            <div className="score-placeholder">
              <p className="score-label">검사를 마치면</p>
              <p className="score-title">여기에서 바로 결과를 보여드릴게요</p>
              <p className="score-summary">
                문항에 점을 찍고 마지막의 <strong>결과 보기</strong> 버튼을 눌러 주세요.
              </p>
            </div>
          )}
        </div>
      </section>

      {hasViewedResults && highRisk ? (
        <section className="safety-banner">
          <strong>지금은 빠른 도움 연결이 중요합니다.</strong>
          <p>
            이 앱은 의료 진단을 대신하지 않습니다. 자살예방상담전화 109,
            정신건강위기상담 1577-0199 또는 가까운 가족·지인에게 바로 연락해 주세요.
          </p>
        </section>
      ) : null}

      {activeTab === 'guide' ? (
        <section className="guide-layout">
          {hasViewedResults ? (
            <article className="panel guide-recommend-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">지금의 추천</p>
                  <h2>오늘 결과에 맞춰 먼저 볼 가이드</h2>
                </div>
                <p className="helper-text">
                  검사 결과와 체크한 감정 태그를 바탕으로 생활 회복 제안을 골랐습니다.
                </p>
              </div>
              <div className="guide-recommend-list">
                {recoveryRecommendations.map((guide) => (
                  <article className="guide-recommend-card" key={`recommended-${guide.category}`}>
                    <div className="guide-card-top">
                      <p className="section-kicker">{guide.kicker}</p>
                      <span className={`guide-icon guide-icon-${guide.category}`} aria-hidden="true">
                        {guide.icon}
                      </span>
                    </div>
                    <h3>{guide.title}</h3>
                    <p>{guide.summary}</p>
                    <strong>이럴 때 보기 좋아요</strong>
                    <p>{guide.when}</p>
                  </article>
                ))}
              </div>
            </article>
          ) : (
            <article className="panel guide-recommend-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">회복 가이드</p>
                  <h2>카테고리별로 가볍게 살펴보세요</h2>
                </div>
                <p className="helper-text">
                  먼저 마음 체크를 하면 지금 상태에 맞는 가이드를 우선 추천해 드립니다.
                </p>
              </div>
            </article>
          )}

          <section className="guide-grid">
            {RECOVERY_GUIDES.map((guide) => (
              <article
                className={
                  recoveryRecommendations.some((item) => item.category === guide.category)
                    ? 'panel guide-card guide-card-highlight'
                    : 'panel guide-card'
                }
                key={guide.category}
              >
                <div className="guide-card-top">
                  <p className="section-kicker">{guide.kicker}</p>
                  <span className={`guide-icon guide-icon-${guide.category}`} aria-hidden="true">
                    {guide.icon}
                  </span>
                </div>
                <h2>{guide.title}</h2>
                <p className="guide-summary">{guide.summary}</p>
                <div className="guide-when">
                  <strong>이럴 때</strong>
                  <p>{guide.when}</p>
                </div>
                <div className="guide-steps">
                  <strong>이렇게 시작해 보세요</strong>
                  <ul>
                    {guide.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
                <p className="guide-note">{guide.note}</p>
              </article>
            ))}
          </section>
        </section>
      ) : (
        <section className="content-grid">
          <article className="panel survey-panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">1. 마음검사</p>
                <h2>오늘 마음 체크</h2>
                <p className="helper-text helper-text-inline">
                  지난 2주를 떠올리며 점 하나씩만 골라 주세요.
                </p>
              </div>
            </div>

            <div className="survey-guide-box">
              <strong>점 설명</strong>
              <p>전혀 없음 → 가끔 느낌 → 며칠 지속 → 자주 느낌 → 거의 매일</p>
            </div>

            <div className="option-legend" aria-hidden="true">
              {OPTIONS.map((option) => (
                <span key={option.label}>{option.label}</span>
              ))}
            </div>

            <div className="question-list">
              {QUESTIONS.map((question, questionIndex) => (
                <div className="question-card" key={question}>
                  <div className="question-row">
                    <p className="question-title">
                      {questionIndex + 1}. {question}
                    </p>
                    <div className="option-row">
                      {OPTIONS.map((option) => (
                        <label className="option-chip" key={option.label}>
                          <input
                            checked={answers[questionIndex] === option.value}
                            name={`question-${questionIndex}`}
                            onChange={() =>
                              handleAnswerChange(questionIndex, option.value)
                            }
                            type="radio"
                          />
                          <span aria-hidden="true" />
                          <span className="sr-only">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="question-selection">
                    선택한 답: <strong>{OPTIONS[answers[questionIndex]]?.label ?? '전혀'}</strong>
                  </p>
                </div>
              ))}
            </div>

            <div className="survey-footer">
              <button className="primary-button survey-result-button" onClick={handleShowResults} type="button">
                결과 보기
              </button>
            </div>
          </article>

          {hasViewedResults ? (
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">2. 마음 날씨</p>
                  <h2>지금 내 기분 한눈에</h2>
                </div>
              </div>

              <div className="weather-grid">
                {WEATHER_OPTIONS.map((weatherOption) => (
                  <button
                    className={weatherOption.label === mood ? 'weather active' : 'weather'}
                    key={weatherOption.label}
                    onClick={() => setMood(weatherOption.label)}
                    type="button"
                  >
                    <span>{weatherOption.emoji}</span>
                    {weatherOption.label}
                  </button>
                ))}
              </div>

              <div className="mission-box">
                <p className="section-kicker">3. 오늘의 회복 미션</p>
                <ul>
                  {missions.map((mission) => (
                    <li key={mission}>{mission}</li>
                  ))}
                </ul>
              </div>
            </article>
          ) : null}

          {hasViewedResults ? (
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">3-1. 마음의 집</p>
                  <h2>지금 내 마음이 머무는 곳</h2>
                </div>
              </div>

              <div className={`mind-house-card ${mindHouse.theme}`}>
                <div className="mind-house-visual" aria-hidden="true">
                  <span>{mindHouse.emoji}</span>
                </div>
                <div className="mind-house-copy">
                  <p className="mind-house-name">{mindHouse.name}</p>
                  <p className="mind-house-description">{mindHouse.description}</p>
                  <div className="mind-house-tip">
                    <strong>회복 제안</strong>
                    <p>{mindHouse.careTip}</p>
                  </div>
                </div>
              </div>
            </article>
          ) : null}

          {hasViewedResults ? (
            <article className="panel guide-link-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">3-2. 맞춤 회복 가이드</p>
                  <h2>지금 먼저 보기 좋은 회복 카테고리</h2>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => setActiveTab('guide')}
                  type="button"
                >
                  회복 가이드 탭 열기
                </button>
              </div>
              <div className="guide-chip-row">
                {recoveryRecommendations.map((guide) => (
                  <button
                    className="guide-chip"
                    key={`guide-chip-${guide.category}`}
                    onClick={() => setActiveTab('guide')}
                    type="button"
                  >
                    {guide.title}
                  </button>
                ))}
              </div>
            </article>
          ) : null}

          {hasViewedResults ? (
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">4. 가벼운 기록</p>
                  <h2>점 찍듯 짧게 남겨도 충분합니다</h2>
                </div>
                <p className="helper-text">선택형 중심으로, 글쓰기는 한 줄만 남깁니다.</p>
              </div>

              <div className="light-diary">
                <div className="tag-group">
                  <strong>오늘 기분</strong>
                  <div className="tag-row">
                    {EMOTION_TAGS.map((tag) => (
                      <button
                        className={
                          diary.emotionTag === tag ? 'tag-button tag-button-active' : 'tag-button'
                        }
                        key={tag}
                        onClick={() => handleDiaryTagChange('emotionTag', tag)}
                        type="button"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="tag-group">
                  <strong>가장 힘든 부분</strong>
                  <div className="tag-row">
                    {HARD_THING_TAGS.map((tag) => (
                      <button
                        className={
                          diary.hardThingTag === tag
                            ? 'tag-button tag-button-active'
                            : 'tag-button'
                        }
                        key={tag}
                        onClick={() => handleDiaryTagChange('hardThingTag', tag)}
                        type="button"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="tag-group">
                  <strong>오늘 감사한 것</strong>
                  <div className="tag-row">
                    {GRATITUDE_TAGS.map((tag) => (
                      <button
                        className={
                          diary.gratitudeTag === tag
                            ? 'tag-button tag-button-active'
                            : 'tag-button'
                        }
                        key={tag}
                        onClick={() => handleDiaryTagChange('gratitudeTag', tag)}
                        type="button"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="short-note">
                  한 줄 메모
                  <input
                    maxLength={40}
                    onChange={(event) =>
                      setDiary((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    placeholder="원하면 짧게만 남겨 보세요."
                    type="text"
                    value={diary.note}
                  />
                </label>
              </div>
            </article>
          ) : null}

          {hasViewedResults ? (
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">5. 위로 카드</p>
                  <h2>오늘의 한마디</h2>
                </div>
              </div>

              <blockquote className="comfort-card">{comfortCard}</blockquote>
              <div className="action-row">
                <button className="secondary-button" onClick={rotateCard} type="button">
                  다른 카드 보기
                </button>
                <button
                  className="kakao-button"
                  disabled={kakaoShareStatus !== 'ready'}
                  onClick={handleKakaoShare}
                  type="button"
                >
                  {kakaoButtonLabel}
                </button>
                <button className="primary-button" onClick={handleGeneralShare} type="button">
                  일반 공유
                </button>
              </div>
              <p className="share-guide">
                카카오 공유는 `VITE_KAKAO_JAVASCRIPT_KEY`가 설정되어 있을 때 활성화됩니다.
              </p>
              {shareMessage ? <p className="helper-text">{shareMessage}</p> : null}

              <div className="follow-up-card">
                <p className="section-kicker">다음 선택</p>
                <h3>불안과 스트레스도 함께 살펴보고 싶다면 이어서 해볼 수 있어요</h3>
                <p className="helper-text">
                  둘 다 의료 진단이 아니라, 요즘 생활 리듬을 살펴보는 가벼운 자가점검입니다.
                </p>
                <div className="action-row action-row-wrap">
                  <button
                    className="secondary-button"
                    onClick={() => setAnxietyInterest('yes')}
                    type="button"
                  >
                    불안 체크 열기
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => setStressInterest('yes')}
                    type="button"
                  >
                    스트레스 체크 열기
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => {
                      setAnxietyInterest('later')
                      setStressInterest('later')
                    }}
                    type="button"
                  >
                    오늘은 여기까지
                  </button>
                </div>
              </div>
            </article>
          ) : null}

          {hasViewedResults && anxietyInterest === 'yes' ? (
            <article className="panel anxiety-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">5-1. 불안 체크</p>
                  <h2>걱정과 긴장도 함께 살펴볼게요</h2>
                </div>
                <p className="helper-text">GAD-7을 참고해 가볍게 풀어낸 7문항입니다.</p>
              </div>

              <div className="option-legend" aria-hidden="true">
                {OPTIONS.map((option) => (
                  <span key={`anxiety-${option.label}`}>{option.label}</span>
                ))}
              </div>

              <div className="question-list">
                {ANXIETY_QUESTIONS.map((question, questionIndex) => (
                  <div className="question-card" key={question}>
                    <div className="question-row">
                      <p className="question-title">
                        {questionIndex + 1}. {question}
                      </p>
                      <div className="option-row">
                        {OPTIONS.map((option) => (
                          <label className="option-chip" key={`${question}-${option.label}`}>
                            <input
                              checked={anxietyAnswers[questionIndex] === option.value}
                              name={`anxiety-question-${questionIndex}`}
                              onChange={() =>
                                handleAnxietyAnswerChange(questionIndex, option.value)
                              }
                              type="radio"
                            />
                            <span aria-hidden="true" />
                            <span className="sr-only">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <p className="question-selection">
                      선택한 답:{' '}
                      <strong>{OPTIONS[anxietyAnswers[questionIndex]]?.label ?? '전혀'}</strong>
                    </p>
                  </div>
                ))}
              </div>

              <div className="survey-footer">
                <p className="helper-text">
                  점 설명: 전혀 없음 → 가끔 느낌 → 며칠 지속 → 자주 느낌 → 거의 매일
                </p>
                <div className="inline-actions">
                  <button
                    className="secondary-button"
                    onClick={() => setAnxietyInterest('later')}
                    type="button"
                  >
                    나중에 할게요
                  </button>
                  <button
                    className="primary-button survey-result-button"
                    onClick={handleShowAnxietyResults}
                    type="button"
                  >
                    불안 결과 보기
                  </button>
                </div>
              </div>

              {hasViewedAnxietyResults ? (
                <div className={`anxiety-result-card ${anxietySeverity.color}`}>
                  <p className="score-label">불안 신호 결과</p>
                  <strong>{anxietyScore}점</strong>
                  <p className="score-title">{anxietySeverity.label}</p>
                  <p className="score-summary">{anxietySeverity.summary}</p>
                  <div className="anxiety-tip-box">
                    <strong>지금 해볼 수 있는 작은 행동</strong>
                    <ul>
                      {anxietyTips.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </article>
          ) : null}

          {hasViewedResults && stressInterest === 'yes' ? (
            <article className="panel anxiety-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">5-2. 스트레스 체크</p>
                  <h2>요즘 생활 스트레스도 가볍게 확인해 볼게요</h2>
                </div>
                <p className="helper-text">생활 회복 힌트를 위한 6문항 자가점검입니다.</p>
              </div>

              <div className="option-legend" aria-hidden="true">
                {OPTIONS.map((option) => (
                  <span key={`stress-${option.label}`}>{option.label}</span>
                ))}
              </div>

              <div className="question-list">
                {STRESS_QUESTIONS.map((question, questionIndex) => (
                  <div className="question-card" key={question}>
                    <div className="question-row">
                      <p className="question-title">
                        {questionIndex + 1}. {question}
                      </p>
                      <div className="option-row">
                        {OPTIONS.map((option) => (
                          <label className="option-chip" key={`${question}-${option.label}`}>
                            <input
                              checked={stressAnswers[questionIndex] === option.value}
                              name={`stress-question-${questionIndex}`}
                              onChange={() =>
                                handleStressAnswerChange(questionIndex, option.value)
                              }
                              type="radio"
                            />
                            <span aria-hidden="true" />
                            <span className="sr-only">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <p className="question-selection">
                      선택한 답:{' '}
                      <strong>{OPTIONS[stressAnswers[questionIndex]]?.label ?? '전혀'}</strong>
                    </p>
                  </div>
                ))}
              </div>

              <div className="survey-footer">
                <p className="helper-text">
                  부담이 느껴지는 빈도를 기준으로 가장 가까운 답을 골라 주세요.
                </p>
                <div className="inline-actions">
                  <button
                    className="secondary-button"
                    onClick={() => setStressInterest('later')}
                    type="button"
                  >
                    나중에 할게요
                  </button>
                  <button
                    className="primary-button survey-result-button"
                    onClick={handleShowStressResults}
                    type="button"
                  >
                    스트레스 결과 보기
                  </button>
                </div>
              </div>

              {hasViewedStressResults ? (
                <div className={`anxiety-result-card ${stressSeverity.color}`}>
                  <p className="score-label">생활 스트레스 결과</p>
                  <strong>{stressScore}점</strong>
                  <p className="score-title">{stressSeverity.label}</p>
                  <p className="score-summary">{stressSeverity.summary}</p>
                  <div className="anxiety-tip-box">
                    <strong>지금 해볼 수 있는 작은 행동</strong>
                    <ul>
                      {stressTips.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="inline-actions recovery-inline-action">
                    <button
                      className="secondary-button"
                      onClick={() => setActiveTab('guide')}
                      type="button"
                    >
                      추천 회복 가이드 보기
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          ) : null}

          <article className="panel history-panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">6. 회복 발자국</p>
                <h2>기록이 쌓이면 변화가 보입니다</h2>
                <p className="helper-text">검사한 날: {currentCheckDate}</p>
              </div>
              <button
                className="primary-button"
                disabled={!hasViewedResults}
                onClick={handleSave}
                type="button"
              >
                오늘 기록 저장
              </button>
            </div>
            {!hasViewedResults ? (
              <p className="helper-text">먼저 결과 보기를 눌러 오늘 결과를 확인해 주세요.</p>
            ) : null}

            {entries.length === 0 ? (
              <p className="empty-state">
                아직 저장된 기록이 없습니다. 오늘의 점검을 저장해 첫 발자국을 남겨 보세요.
              </p>
            ) : (
              <>
                <div className="progress-banner">
                  최근 기록 기준으로 <strong>{progress}걸음 회복</strong> 했습니다.
                </div>
                <div className="chart-card">
                  <div className="chart-copy">
                    <div>
                      <p className="section-kicker">최근 점수 흐름</p>
                      <h3>마음 온도 그래프</h3>
                    </div>
                    <p className="helper-text">
                      최근 {chartEntries.length}회 기록을 기준으로 점수 변화를 보여줍니다.
                    </p>
                  </div>
                  <div className="chart-shell">
                    <svg
                      aria-label="마음 점수 변화 차트"
                      className="history-chart"
                      role="img"
                      viewBox="0 0 320 156"
                    >
                      <line className="chart-axis" x1="20" x2="20" y1="12" y2="136" />
                      <line className="chart-axis" x1="20" x2="300" y1="136" y2="136" />
                      <line className="chart-grid" x1="20" x2="300" y1="28" y2="28" />
                      <line className="chart-grid" x1="20" x2="300" y1="82" y2="82" />
                      <polyline className="chart-line" fill="none" points={chartPoints} />
                      {chartEntries.map((entry, index) => {
                        const x =
                          chartEntries.length === 1
                            ? 160
                            : 24 + (272 / (chartEntries.length - 1)) * index
                        const y = 132 - (entry.score / chartMaxScore) * 108

                        return (
                          <g key={`${entry.id}-chart`}>
                            <circle className="chart-dot" cx={x} cy={y} r="5" />
                            <text className="chart-value" x={x} y={y - 10}>
                              {entry.score}
                            </text>
                          </g>
                        )
                      })}
                    </svg>
                    <div className="chart-labels">
                      {chartEntries.map((entry) => (
                        <span key={`${entry.id}-label`}>{entry.date.split(' ')[1]}</span>
                      ))}
                    </div>
                  </div>
                  <div className="chart-summary">
                    <div>
                      <span>최고</span>
                      <strong>{chartHigh}점</strong>
                    </div>
                    <div>
                      <span>최저</span>
                      <strong>{chartLow}점</strong>
                    </div>
                    <div>
                      <span>변화</span>
                      <strong>{chartDelta > 0 ? `+${chartDelta}` : chartDelta}점</strong>
                    </div>
                  </div>
                </div>

                <div className="history-toolbar">
                  <div className="history-filter">
                    <label htmlFor="entry-date-filter">날짜별 보기</label>
                    <select
                      id="entry-date-filter"
                      onChange={(event) => {
                        const nextDate = event.target.value
                        setSelectedDate(nextDate)
                        const nextEntries =
                          nextDate === 'all'
                            ? entries
                            : entries.filter((entry) => entry.date === nextDate)
                        setSelectedEntryId(nextEntries[0]?.id ?? null)
                      }}
                      value={selectedDate}
                    >
                      <option value="all">전체 기록</option>
                      {dateOptions.map((date) => (
                        <option key={date} value={date}>
                          {date}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="helper-text">
                    총 {filteredEntries.length}개의 기록을 보고 있습니다.
                  </p>
                </div>

                {selectedEntry ? (
                  <div className="history-detail-card">
                    <div className="history-detail-heading">
                      <div>
                        <p className="section-kicker">상세 기록</p>
                        <h3>검사한 날: {selectedEntry.date}</h3>
                      </div>
                      <button
                        className="secondary-button"
                        onClick={() => handleDeleteEntry(selectedEntry.id)}
                        type="button"
                      >
                        이 기록 삭제
                      </button>
                    </div>
                    <div className="history-detail-grid">
                      <div>
                        <span>마음 점수</span>
                        <strong>{selectedEntry.score}점</strong>
                      </div>
                      <div>
                        <span>마음 상태</span>
                        <strong>{getSeverity(selectedEntry.score).label}</strong>
                      </div>
                      <div>
                        <span>마음 날씨</span>
                        <strong>{selectedEntry.mood}</strong>
                      </div>
                    </div>
                    <div className="history-detail-notes">
                      <div>
                        <strong>오늘 기분</strong>
                        <p>{selectedEntry.diary.emotionTag || '선택 없음'}</p>
                      </div>
                      <div>
                        <strong>힘들었던 부분</strong>
                        <p>{selectedEntry.diary.hardThingTag || '선택 없음'}</p>
                      </div>
                      <div>
                        <strong>감사한 것</strong>
                        <p>{selectedEntry.diary.gratitudeTag || '선택 없음'}</p>
                      </div>
                    </div>
                    {selectedEntry.diary.note ? (
                      <div className="history-note-box">
                        <strong>한 줄 메모</strong>
                        <p>{selectedEntry.diary.note}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="history-list">
                  {filteredEntries.map((entry) => (
                    <button
                      className={
                        selectedEntry?.id === entry.id
                          ? 'history-item history-item-active'
                          : 'history-item'
                      }
                      key={entry.id}
                      onClick={() => setSelectedEntryId(entry.id)}
                      type="button"
                    >
                      <div>
                        <strong>검사한 날: {entry.date}</strong>
                        <p>
                          {getSeverity(entry.score).label} · {entry.mood}
                        </p>
                      </div>
                      <span>{entry.score}점</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </article>
        </section>
      )}
      <footer className="app-footer">
        <p>
          마음체크는 자가점검과 생활 회복 제안을 돕는 앱이며, 의료 진단이나 치료를 대신하지
          않습니다.
        </p>
        <div className="app-footer-links">
          <a href="/privacy-policy.html" target="_blank" rel="noreferrer">
            개인정보처리방침
          </a>
        </div>
      </footer>
    </main>
  )
}

export default App
