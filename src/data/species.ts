import { PetExpression, PetSpecies, PetSpeciesInfo, PetTouchZone } from '../types';

export const PET_SPECIES_LIST: PetSpecies[] = ['pig', 'rabbit', 'dog'];

export const PET_SPECIES_INFO: Record<PetSpecies, PetSpeciesInfo> = {
  pig: {
    id: 'pig',
    label: '粉紅小豬',
    shortName: '小豬',
    eggColor: '#FFB6CA',
    accentColor: '#FF7A9E',
    favoriteFoodIds: ['caramel_pudding', 'crispy_fries'],
    greeting: '呼嚕呼嚕～今天也想吃香噴噴的點心！',
    pettedSpeech: '呼嚕呼嚕～好喜歡摸摸喔！',
    favoriteFoodReaction: '呼嚕～這是我最愛的料理，幸福度爆表！',
    zoneSpeeches: {
      head: [
        '呼嚕呼嚕～摸頭最舒服了，感覺被溫柔地誇獎了！',
        '軟軟的大耳朵動呀動～再多摸兩下嘛！',
        '頭頂暖呼呼的，今天也要當最乖的食堂小豬！',
        '被你輕輕摸著頭，一整天的煩惱都飄走囉～',
        '呼嚕… 頭頂好放鬆，差點舒服到眯起眼睛打盹了！',
        '只要你摸摸我的頭，我就覺得自己是全世界最幸福的小豬！',
        '好喜歡你的手心溫度喔～再陪我待一會兒好不好？',
        '呼嚕呼嚕～頭頂充飽元氣了！等一下想吃香噴噴的點心～',
      ],
      cheek: [
        '軟綿綿的腮幫子是不是很好捏呀～嘻嘻！',
        '粉紅小鼻子貼貼！呼嚕～好幸福喔～',
        '臉頰肉嘟嘟的，捏起來像剛出爐的棉花糖對吧？',
        '輕輕搓臉臉好害羞喔，腮幫子都要變成草莓色了！',
        '呼嚕～你的指尖軟軟的，蹭在臉上好療癒呀～',
        '臉頰Q彈有彈性，可不是貪吃才變圓的喔… 好吧有一點點！',
        '雙手捧著我的臉臉時，眼睛裡全都是你呢～',
      ],
      belly: [
        '圓滾滾肚肚被揉得好放鬆～呼嚕呼嚕～',
        '咕嚕～這不是餓，是肚子在開心唱歌！',
        '吃飽飽的小肚皮最療癒了，靠著一起休息一下吧～',
        '哈哈好癢喔～揉肚肚的時候人家會忍不住扭來扭去！',
        '這裡面裝滿了美味點心，還有對你滿滿的喜歡喔～',
        '暖烘烘的粉紅小肚皮，是專屬你的減壓抱枕！',
        '輕輕畫圈按摩肚肚，感覺整隻豬都要融化成布丁了～',
      ],
      paw: [
        '粉紅小手手跟你擊掌！今天一起元氣滿滿！',
        '牽緊緊～不管去散步還是去食堂都要一起喔！',
        '小短手努力比一個愛心送給你 🩷',
        '碰碰軟Q的小蹄子，把今天的好運分給你一半！',
        '牽住你的手指就覺得好安心，什麼都不怕了～',
        '小豬擊掌一百分！我們是最有默契的好搭檔！',
      ],
    },
  },
  rabbit: {
    id: 'rabbit',
    label: '棉花糖小兔',
    shortName: '小兔',
    eggColor: '#C5F0DF',
    accentColor: '#5CC9A7',
    favoriteFoodIds: ['carrot_salad', 'fruit_box'],
    greeting: '啾啾～最喜歡脆脆的紅蘿蔔和香甜水果盒！',
    pettedSpeech: '耳朵軟綿綿～被你摸摸好開心啾！',
    favoriteFoodReaction: '咔滋咔滋！是我最愛的紅蘿蔔與果香啾！',
    zoneSpeeches: {
      head: [
        '長耳朵最喜歡被輕輕順毛了啾～好溫柔！',
        '頭頂被摸得暖呼呼的，差點舒服到打瞌睡啾～',
        '兔耳豎得高高的，代表我現在心情一百分！',
        '從頭頂一路順到耳尖，這是最神奇的快樂魔法啾～',
        '啾～被摸摸頭的時候，感覺心裡像晴天一樣亮晶晶的！',
        '輕輕撫摸我的耳朵，疲憊一下子就全都消散囉～',
        '今天的你也很努力了對吧？換小兔靠著你給你加油啾！',
        '頭頂軟綿綿的毛毛，只有最信任的你才能摸個夠喔～',
      ],
      cheek: [
        '臉頰鼓鼓像棉花糖對不對？才沒有偷藏紅蘿蔔啦！',
        '輕輕點我的小鼻尖好癢喔～啾咪！',
        '腮幫子被搓得好害羞，臉都紅撲撲了啾～',
        '小鬍鬚跟著一顫一顫的，這就是開心的暗號喔！',
        '臉貼臉的時候最溫暖了，感覺像被云朵包住一樣啾～',
        '軟呼呼的小臉頰任你捏，但要記得給一顆小草莓當獎勵喔！',
        '被摸著臉臉時，心情就像吃到水嫩脆甜的水果一樣幸福！',
      ],
      belly: [
        '呼哇～揉肚肚好癢呀哈哈哈！再輕一點點啾～',
        '白白軟軟的麻糬肚肚，只有最喜歡的人能摸喔！',
        '揉完肚肚感覺又可以多吃一盒水果盒了啾！',
        '兔肚肚像剛曬過太陽的羽絨被，暖洋洋的對吧？',
        '咕嚕啾～肚肚被順毛摸著，整隻兔都要變成一顆小白糰子了！',
        '輕輕揉一揉小肚子，感覺所有不開心都被收進口袋裡變不見啦！',
        '哎呀～再揉下去小兔要翻肚皮睡著了啾 zzz',
      ],
      paw: [
        '軟綿綿的小兔掌給你握緊緊～好溫暖啾！',
        '碰碰幸運肉球，今天一定會有好事發生！',
        '牽牽手手，要帶我去農場看看紅蘿蔔了嗎？',
        '小兔爪輕輕搭在你手背上，把甜滋滋的好心情傳給你～',
        '雙手拍拍！不管今天累不累，小兔永遠站在你這邊啾！',
        '偷偷把小幸運塞進你手心裡，記得收好喔～',
      ],
    },
  },
  dog: {
    id: 'dog',
    label: '奶油小狗',
    shortName: '小狗',
    eggColor: '#FFE099',
    accentColor: '#E6A222',
    favoriteFoodIds: ['meat_bento', 'cheese_burger'],
    greeting: '汪汪！今天也要吃肉肉便當再一起去散步！',
    pettedSpeech: '尾巴搖不停～最喜歡你了汪！',
    favoriteFoodReaction: '汪嗚！太香太好吃了，尾巴搖成螺旋槳！',
    zoneSpeeches: {
      head: [
        '摸頭就是最棒的獎勵對吧！尾巴搖成電風扇汪！',
        '最喜歡主人摸我的垂垂大耳朵了汪嗚～',
        '乖寶寶被誇獎了！是不是還可以順便吃點心？',
        '只要頭頂有你的手手，我就覺得好踏實好安心汪！',
        '呼嚕汪～你手心好暖喔，我可以再靠過來一點點嗎？',
        '不管你在外頭多辛苦，回家都可以盡情摸摸我的頭充電汪！',
        '耳朵垂垂的聽你說話，今天也是最愛主人的一天！',
        '被摸頭瞬間電力滿格！隨時準備陪你衝去公園散步汪！',
      ],
      cheek: [
        '臉頰肉超彈超好揉吧～隨便你捏汪！',
        '濕潤潤的小鼻子跟你的指尖打招呼汪！',
        '被雙手捧著臉臉好幸福，永遠黏著你汪～',
        '奶油色腮幫子越揉越鬆軟，像剛烤好的奶油麵包對吧？',
        '蹭蹭你的掌心～有你在身邊就是最治癒的時光汪！',
        '輕輕搔搔下巴跟臉側，我都要露出傻呼呼的笑臉了汪～',
        '把整個小臉埋進你手裡，世界上哪裡都比不上這裡舒服！',
      ],
      belly: [
        '立刻翻肚肚給你摸摸！這是最信任你的表現汪～',
        '肚皮被搓得好酥麻，後腳都要跟著踢兩下了汪！',
        '揉揉暖呼呼的小肚子，準備迎接下頓大餐！',
        '嗚哇～這個抓肚肚的角度太剛好了，舒服到想哼歌汪～',
        '肚子暖暖軟軟的，難過的時候就靠著我休息吧汪！',
        '四腳朝天給你盡情揉揉，今天的治癒能量由我負責提供！',
        '揉肚肚五分鐘，煩惱通通清零！要不要再多摸一下汪？',
      ],
      paw: [
        '握手手大成功！我是食堂最聰明的小狗汪！',
        '擊掌！Give me five 汪汪～今天也很棒！',
        '把小手手放在你掌心，散步的時候牽緊緊喔！',
        '粉嫩小肉球蓋章認證：你今天做得超級好汪！',
        '左腳換右腳，每天最期待的就是跟你玩握手遊戲！',
        '牽住你的手就不想放開，要一直一起走下去喔汪～',
      ],
    },
  },
};

const MOOD_BONUS_SPEECHES: Record<PetSpecies, { high: string[]; low: string[] }> = {
  pig: {
    high: [
      '今天心情超好！整個食堂都在閃閃發亮呢～呼嚕！',
      '有你陪在身邊的每一秒，都是最香甜的蜜糖時光！',
    ],
    low: [
      '呼嚕… 剛剛有點小孤單，幸好你來摸摸我了！',
      '被抱抱摸摸以後心情變好多了，再多陪陪我嘛～',
    ],
  },
  rabbit: {
    high: [
      '心情像灑滿糖粉的草莓蛋糕一樣甜滋滋啾～',
      '今天開心到耳朵都想跟著跳舞了啾啾！',
    ],
    low: [
      '啾… 剛剛心裡有點悶悶的，謝謝你溫柔地安慰我！',
      '只要聞到你身上的味道，小兔就覺得安心多了啾～',
    ],
  },
  dog: {
    high: [
      '今天是滿分級的好日子！尾巴搖到停不下來汪！',
      '和最喜歡的主人待在一起，幸福值直接破表汪嗚！',
    ],
    low: [
      '嗚汪… 有點想你了，摸摸我我馬上就能打起精神！',
      '謝謝你來陪我，被你撫摸一下下我就重新充滿勇氣啦汪！',
    ],
  },
};

export const TOUCH_ZONE_META: Record<
  PetTouchZone,
  {
    feedbacks: { text: string; emoji: string }[];
    expressions: PetExpression[];
  }
> = {
  head: {
    feedbacks: [
      { text: '好喜歡摸頭！', emoji: '✨' },
      { text: '乖寶寶最棒！', emoji: '🌟' },
      { text: '耳朵軟綿綿～', emoji: '🩷' },
      { text: '頭頂暖呼呼！', emoji: '☀️' },
      { text: '治癒能量+1', emoji: '💫' },
      { text: '開心眯眯眼～', emoji: '💛' },
    ],
    expressions: ['sparkle', 'happyTongue', 'wink'],
  },
  cheek: {
    feedbacks: [
      { text: '臉頰軟Q～', emoji: '😳' },
      { text: '捏捏小臉！', emoji: '💕' },
      { text: '害羞臉紅紅', emoji: '🍓' },
      { text: '棉花糖臉蛋！', emoji: '☁️' },
      { text: '貼貼最幸福～', emoji: '🩷' },
      { text: '臉頰彈潤潤！', emoji: '✨' },
    ],
    expressions: ['shy', 'wink', 'happyTongue'],
  },
  belly: {
    feedbacks: [
      { text: '肚肚好癢！', emoji: '😆' },
      { text: '圓滾好舒服～', emoji: '🍮' },
      { text: '幸福咕嚕嚕', emoji: '💛' },
      { text: '暖呼呼肚皮！', emoji: '🫧' },
      { text: '翻肚肚撒嬌～', emoji: '🌟' },
      { text: '軟綿麻糬肚！', emoji: '🍡' },
    ],
    expressions: ['ticklish', 'happyTongue', 'sparkle'],
  },
  paw: {
    feedbacks: [
      { text: '握手手成功！', emoji: '🐾' },
      { text: '擊掌 High Five！', emoji: '🙌' },
      { text: '牽牽小手手', emoji: '💞' },
      { text: '肉球蓋章！', emoji: '🌸' },
      { text: '好搭檔認證！', emoji: '⭐' },
    ],
    expressions: ['wink', 'sparkle', 'happyTongue'],
  },
};

export function getPetSpeciesInfo(species: PetSpecies): PetSpeciesInfo {
  return PET_SPECIES_INFO[species] ?? PET_SPECIES_INFO.pig;
}

export function pickRandomNonRepeating<T>(items: T[], lastItem?: T): T {
  if (items.length <= 1) return items[0];
  const candidates = lastItem !== undefined ? items.filter((item) => item !== lastItem) : items;
  const pool = candidates.length > 0 ? candidates : items;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getRandomZoneSpeech(
  species: PetSpecies,
  zone: PetTouchZone,
  mood?: number,
  lastSpeech?: string
): string {
  const speciesInfo = getPetSpeciesInfo(species);
  const baseLines = speciesInfo.zoneSpeeches[zone];
  const bonus = MOOD_BONUS_SPEECHES[species] ?? MOOD_BONUS_SPEECHES.pig;

  let pool = [...baseLines];
  if (typeof mood === 'number') {
    if (mood >= 80) {
      pool = [...pool, ...bonus.high];
    } else if (mood <= 45) {
      pool = [...pool, ...bonus.low];
    }
  }

  return pickRandomNonRepeating(pool, lastSpeech);
}

