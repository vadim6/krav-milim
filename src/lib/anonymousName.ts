const ADJECTIVES = [
  "Brave", "Quick", "Clever", "Bold", "Sharp",
  "Swift", "Calm", "Fierce", "Wise", "Bright",
  "Sly", "Keen", "Wild", "Proud", "Agile",
  "Stoic", "Nimble", "Daring", "Stealth", "Mighty",
]

const ANIMALS = [
  "Lion", "Fox", "Bear", "Wolf", "Hawk",
  "Tiger", "Eagle", "Lynx", "Panda", "Cobra",
  "Falcon", "Jaguar", "Otter", "Raven", "Shark",
  "Badger", "Viper", "Moose", "Crane", "Bison",
]

const STORAGE_KEY = "krav-milim-demo-name"

export function getAnonymousName(): string {
  if (typeof window === "undefined") return "Anonymous"
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return stored
  const adj    = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  const name   = `${adj}${animal}`
  localStorage.setItem(STORAGE_KEY, name)
  return name
}
