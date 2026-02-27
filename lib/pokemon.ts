// Gen 1 기본형 (진화 없거나 진화 전 단계)만 배정
// 2단진화: 이상해씨(1), 파이리(4), 꼬부기(7), 캐터피(10), 뿔충이(13), 구구(16), 니드란♀(29), 니드란♂(32), 식스테일(37), 푸린(39), 주뱃(41), 디그다(50), 가디(58), 망나뇽의 미뇽(147→148→149 미뇽이 기본), 잉어킹(129)
// 1단진화: 아라리(27), 모래두지(28 X — 2단), 꼬렛(19), 까마귀(21)...
// 단일진화 없음: 루주라(124), 캥카(115), 파라스(46→47 2단), 왕눈해(120→121)
// → 정의: 진화를 앞으로 할 수 있는 포켓몬 중 가장 초기 단계
const BASE_FORMS = [
  1,   // 이상해씨
  4,   // 파이리
  7,   // 꼬부기
  10,  // 캐터피
  13,  // 뿔충이
  16,  // 구구
  19,  // 꼬렛
  21,  // 깨비참
  23,  // 아보
  27,  // 모래두지
  29,  // 니드란♀
  32,  // 니드란♂
  35,  // 삐삐
  37,  // 식스테일
  39,  // 푸린
  41,  // 주뱃
  43,  // 뚜벅초
  46,  // 파라스
  48,  // 콘팡
  50,  // 디그다
  52,  // 나옹
  54,  // 고라파덕
  56,  // 망키
  58,  // 가디
  60,  // 발챙이
  63,  // 케이시 (후딘)
  66,  // 알통몬
  69,  // 모다피
  72,  // 왕눈해(단일) — 72는 왕눈해, 73은 독침붕 → 73도 진화형이므로 72만
  74,  // 꼬마돌
  77,  // 포니타
  79,  // 야돈
  81,  // 코일
  84,  // 두두
  86,  // 쥬쥬
  88,  // 질퍽이
  90,  // 셀러
  92,  // 고오스
  95,  // 롱스톤 (단일)
  96,  // 슬리프
  98,  // 크랩
  100, // 찌리리공
  102, // 아라리
  104, // 탕탕이
  108, // 내루미 (단일)
  109, // 독독이
  111, // 뿔카노
  113, // 럭키 (단일)
  114, // 덩쿠리 (단일)
  115, // 캥카 (단일)
  116, // 쏙독어
  118, // 콘치
  120, // 별가사리
  122, // 마임맨 (단일)
  123, // 스라크 (단일)
  124, // 루주라 (단일)
  125, // 에레브 (단일, Gen1)
  126, // 마그마 (단일, Gen1)
  127, // 쁘사이저 (단일)
  128, // 켄타로스 (단일)
  129, // 잉어킹
  131, // 라프라스 (단일)
  132, // 메타몽 (단일)
  133, // 이브이
  138, // 암나이트
  140, // 투구
  143, // 잠만보 (단일)
  147, // 미뇽
]

export async function assignRandomPokemon(usedIds: number[]): Promise<number> {
  const available = BASE_FORMS.filter(id => !usedIds.includes(id))
  if (available.length === 0) throw new Error('모든 기본형 포켓몬이 이미 배정됨')
  return available[Math.floor(Math.random() * available.length)]
}

export function getEvolutionStage(progress: number): 0 | 1 | 2 | 3 {
  if (progress === 0) return 0
  if (progress < 50) return 1
  if (progress < 100) return 2
  return 3
}

export function getSpriteUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/${pokemonId}.png`
}

export const EGG_SPRITE = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/mystery-egg.png`

export function isAbandoned(lastUpdatedAt: string): boolean {
  return Date.now() - new Date(lastUpdatedAt).getTime() > 14 * 24 * 60 * 60 * 1000
}
