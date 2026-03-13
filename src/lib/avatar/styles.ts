import { avataaars } from "@dicebear/collection"
import { openPeeps } from "@dicebear/collection"

export type StyleId = "avataaars" | "open-peeps"

export interface AvatarConfig {
  style:   StyleId
  options: Record<string, string | string[]>
}

export interface OptionDef {
  key:      string
  label:    string
  type:     "swatches" | "visual"
  values:   string[]
  viewBox?: string   // SVG viewBox override to focus on relevant area in thumbnails
}

export interface StyleConfig {
  id:             StyleId
  label:          string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  module:         any
  options:        OptionDef[]
  defaultOptions: Record<string, string | string[]>
  previewBase:    Record<string, string[]>   // neutral base for generating per-option thumbnails
}

export const AVATAR_STYLES: StyleConfig[] = [
  {
    id:     "avataaars",
    label:  "Avataaars",
    module: avataaars,
    defaultOptions: {
      backgroundColor: ["transparent"],
      skinColor:       ["d08b5b"],
      top:             ["shortFlat"],
      hairColor:       ["724133"],
      eyes:            ["default"],
      eyebrows:        ["default"],
      mouth:           ["smile"],
      facialHair:      [],
      facialHairColor: ["2c1b18"],
      accessories:     [],
      clothesColor:    ["5199e4"],
      clothing:        ["hoodie"],
    },
    // Neutral base used when generating per-option preview thumbnails.
    // Keep consistent skin/face/clothing so the option being previewed stands out.
    previewBase: {
      backgroundColor: ["transparent"],
      skinColor:       ["d08b5b"],
      hairColor:       ["724133"],
      eyes:            ["default"],
      eyebrows:        ["defaultNatural"],
      mouth:           ["smile"],
      facialHair:      [],
      accessories:     [],
      clothing:        ["hoodie"],
      clothesColor:    ["5199e4"],
    },
    options: [
      {
        key:    "backgroundColor",
        label:  "רקע",
        type:   "swatches",
        values: ["transparent", "b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf", "a8e6cf", "ffd3b6", "f0f0f0", "1a1a2e"],
      },
      {
        key:    "skinColor",
        label:  "גוון עור",
        type:   "swatches",
        values: ["614335", "ae5d29", "d08b5b", "edb98a", "ffdbb4", "fd9841", "f8d25c"],
      },
      {
        key:     "top",
        label:   "שיער / ראש",
        type:    "visual",
        viewBox: "0 0 280 200",
        values: [
          "bigHair", "bob", "bun", "curly", "curvy", "dreads", "dreads01", "dreads02",
          "frida", "frizzle", "fro", "froBand", "hat", "hijab", "longButNotTooLong",
          "miaWallace", "shaggy", "shaggyMullet", "shavedSides", "shortCurly",
          "shortFlat", "shortRound", "shortWaved", "sides", "straight01", "straight02",
          "straightAndStrand", "theCaesar", "theCaesarAndSidePart", "turban",
          "winterHat1", "winterHat02", "winterHat03", "winterHat04",
        ],
      },
      {
        key:    "hairColor",
        label:  "צבע שיער",
        type:   "swatches",
        values: ["a55728", "2c1b18", "b58143", "d6b370", "724133", "4a312c", "f59797", "ecdcbf", "c93305", "e8e1e1"],
      },
      {
        key:     "eyes",
        label:   "עיניים",
        type:    "visual",
        viewBox: "40 115 200 80",
        values: ["closed", "cry", "default", "eyeRoll", "happy", "hearts", "side", "squint", "surprised", "wink", "winkWacky", "xDizzy"],
      },
      {
        key:     "eyebrows",
        label:   "גבות",
        type:    "visual",
        viewBox: "40 95 200 80",
        values: [
          "angry", "angryNatural", "default", "defaultNatural", "flatNatural",
          "frownNatural", "raisedExcited", "raisedExcitedNatural", "sadConcerned",
          "sadConcernedNatural", "unibrowNatural", "upDown", "upDownNatural",
        ],
      },
      {
        key:     "mouth",
        label:   "פה",
        type:    "visual",
        viewBox: "60 155 160 80",
        values: ["concerned", "default", "disbelief", "eating", "grimace", "sad", "screamOpen", "serious", "smile", "tongue", "twinkle", "vomit"],
      },
      {
        key:     "facialHair",
        label:   "זקן",
        type:    "visual",
        viewBox: "40 140 200 120",
        values: ["beardLight", "beardMajestic", "beardMedium", "moustacheFancy", "moustacheMagnum"],
      },
      {
        key:    "facialHairColor",
        label:  "צבע זקן",
        type:   "swatches",
        values: ["2c1b18", "4a312c", "724133", "a55728", "b58143", "c93305", "d6b370", "e8e1e1", "ecdcbf", "f59797"],
      },
      {
        key:     "accessories",
        label:   "אביזרים",
        type:    "visual",
        viewBox: "40 105 200 100",
        values: ["eyepatch", "kurt", "prescription01", "prescription02", "round", "sunglasses", "wayfarers"],
      },
      {
        key:     "clothing",
        label:   "בגדים",
        type:    "visual",
        viewBox: "0 170 280 110",
        values: ["blazerAndShirt", "blazerAndSweater", "collarAndSweater", "graphicShirt", "hoodie", "overall", "shirtCrewNeck", "shirtScoopNeck", "shirtVNeck"],
      },
      {
        key:    "clothesColor",
        label:  "צבע בגדים",
        type:   "swatches",
        values: ["262e33", "65c9ff", "5199e4", "25557c", "e6e6e6", "929598", "3c4f5c", "b1e2ff", "a7ffc4", "ffdeb5", "ffafb9", "ffffb1", "ff488e", "ff5c5c", "ffffff"],
      },
    ],
  },
  {
    id:     "open-peeps",
    label:  "Open Peeps",
    module: openPeeps,
    defaultOptions: {
      backgroundColor: ["transparent"],
      skinColor:    ["d08b5b"],
      head:         ["medium1"],
      face:         ["smile"],
      facialHair:   [],
      accessories:  [],
      clothingColor: ["8fa7df"],
    },
    previewBase: {
      backgroundColor: ["transparent"],
      skinColor:     ["d08b5b"],
      face:          ["smile"],
      facialHair:    [],
      accessories:   [],
      clothingColor: ["8fa7df"],
    },
    options: [
      {
        key:    "backgroundColor",
        label:  "רקע",
        type:   "swatches",
        values: ["transparent", "b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf", "a8e6cf", "ffd3b6", "f0f0f0", "1a1a2e"],
      },
      {
        key:    "skinColor",
        label:  "גוון עור",
        type:   "swatches",
        values: ["694d3d", "ae5d29", "d08b5b", "edb98a", "ffdbb4"],
      },
      {
        key:     "head",
        label:   "שיער / ראש",
        type:    "visual",
        viewBox: "0 0 704 480",
        values: [
          "afro", "bangs", "bangs2", "bantuKnots", "bear", "bun", "bun2", "buns",
          "cornrows", "cornrows2", "dreads1", "dreads2", "flatTop", "flatTopLong",
          "grayBun", "grayMedium", "grayShort", "hatBeanie", "hatHip", "hijab",
          "long", "longAfro", "longBangs", "longCurly", "medium1", "medium2",
          "medium3", "mediumBangs", "mediumBangs2", "mediumBangs3", "mediumStraight",
          "mohawk", "mohawk2", "noHair1", "noHair2", "noHair3", "pomp", "shaved1",
          "shaved2", "shaved3", "short1", "short2", "short3", "short4", "short5",
          "turban", "twists", "twists2",
        ],
      },
      {
        key:     "face",
        label:   "הבעה",
        type:    "visual",
        viewBox: "150 180 400 300",
        values: [
          "angryWithFang", "awe", "blank", "calm", "cheeky", "concerned",
          "concernedFear", "contempt", "cute", "cyclops", "driven", "eatingHappy",
          "explaining", "eyesClosed", "fear", "hectic", "lovingGrin1", "lovingGrin2",
          "monster", "old", "rage", "serious", "smile", "smileBig", "smileLOL",
          "smileTeethGap", "solemn", "suspicious", "tired", "veryAngry",
        ],
      },
      {
        key:     "facialHair",
        label:   "זקן",
        type:    "visual",
        viewBox: "150 320 400 280",
        values: [
          "chin", "full", "full2", "full3", "full4", "goatee1", "goatee2",
          "moustache1", "moustache2", "moustache3", "moustache4", "moustache5",
          "moustache6", "moustache7", "moustache8", "moustache9",
        ],
      },
      {
        key:     "accessories",
        label:   "אביזרים",
        type:    "visual",
        viewBox: "120 200 460 260",
        values: ["eyepatch", "glasses", "glasses2", "glasses3", "glasses4", "glasses5", "sunglasses", "sunglasses2"],
      },
      {
        key:    "clothingColor",
        label:  "צבע בגדים",
        type:   "swatches",
        values: ["8fa7df", "9ddadb", "78e185", "e279c7", "e78276", "fdea6b", "ffcf77"],
      },
    ],
  },
]
