import {
  DialogueCategory,
  DialogueResponse,
  PersonalityId,
  PetMemoryEvent,
  PetSpecies,
  TimePeriodId,
  WeatherCondition,
} from '../types';

/**
 * NOTE: First release uses fixed 'clear' sunny weather without network API calls.
 * When integrating a real weather API in the future, store the API key strictly in
 * Vercel Environment Variables (server-side proxy route) — NEVER in frontend code or GitHub.
 */

export const DIALOGUE_CATEGORY_META: Record<
  DialogueCategory,
  { label: string; emoji: string; badgeClass: string }
> = {
  coop: {
    label: '共養動態',
    emoji: '💞',
    badgeClass: 'bg-[#FFEAF2] border-[#F4B4CB] text-[#C43463]',
  },
  urgent: {
    label: '緊急需求',
    emoji: '🚨',
    badgeClass: 'bg-[#FFE7EA] border-[#F3A8B4] text-[#C42B48]',
  },
  memory: {
    label: '心情記憶',
    emoji: '💭',
    badgeClass: 'bg-[#FFF1D8] border-[#F2C97D] text-[#9A5B12]',
  },
  special: {
    label: '特別時刻',
    emoji: '🎉',
    badgeClass: 'bg-[#EFEAFF] border-[#C9BDF2] text-[#5B449C]',
  },
  personality: {
    label: '個性悄悄話',
    emoji: '✨',
    badgeClass: 'bg-[#FFF5E0] border-[#F4D28A] text-[#8E5910]',
  },
  time: {
    label: '時段問候',
    emoji: '🕰️',
    badgeClass: 'bg-[#E6F7F0] border-[#A7E0CB] text-[#1F6B54]',
  },
  weather: {
    label: '天氣話題',
    emoji: '🌤️',
    badgeClass: 'bg-[#EAF3FF] border-[#B6D1FA] text-[#2F5B9E]',
  },
  daily: {
    label: '日常閒聊',
    emoji: '💬',
    badgeClass: 'bg-[#F6EFEA] border-[#E2D3CA] text-[#6E544E]',
  },
};

export const QUICK_RESPONSES: Record<string, DialogueResponse> = {
  walk: {
    id: 'resp_walk',
    label: '好呀，我們去散步！',
    emoji: '🌿',
    actionType: 'walk',
    replyText: '耶～最喜歡跟你一起出門散步吹吹風了！',
    intimacyGain: 2,
    moodGain: 6,
    petAction: 'walking',
    expression: 'wink',
  },
  pudding: {
    id: 'resp_pudding',
    label: '我幫你準備布丁。',
    emoji: '🍮',
    actionType: 'feed_pudding',
    replyText: '哇！香香甜甜的布丁～一口吃掉超幸福！',
    intimacyGain: 2,
    moodGain: 6,
    petAction: 'eating',
    expression: 'sparkle',
  },
  hug: {
    id: 'resp_hug',
    label: '抱抱你。',
    emoji: '🩷',
    actionType: 'hug',
    replyText: '嘿嘿，蹭蹭你的手心，心裡暖呼呼的！',
    intimacyGain: 2,
    moodGain: 5,
    petAction: 'petted',
    expression: 'shy',
  },
  sleep: {
    id: 'resp_sleep',
    label: '今天先休息吧。',
    emoji: '💤',
    actionType: 'sleep',
    replyText: '嗯嗯… 窩進軟軟的小被被裡充飽電！',
    intimacyGain: 1,
    moodGain: 4,
    petAction: 'sleeping',
    expression: 'shy',
  },
  bath: {
    id: 'resp_bath',
    label: '我幫你洗澡。',
    emoji: '🫧',
    actionType: 'bath',
    replyText: '泡泡澡好舒服～洗完香噴噴的！',
    intimacyGain: 2,
    moodGain: 5,
    petAction: 'bathing',
    expression: 'happyTongue',
  },
  meal: {
    id: 'resp_meal',
    label: '馬上端熱騰騰的飯給你！',
    emoji: '🍱',
    actionType: 'feed_meal',
    replyText: '開動囉～肚子暖呼呼的好滿足！',
    intimacyGain: 2,
    moodGain: 6,
    petAction: 'eating',
    expression: 'sparkle',
  },
  ack: {
    id: 'resp_ack',
    label: '我知道了，真可愛！',
    emoji: '✨',
    actionType: 'ack',
    replyText: '嘻嘻～有你陪在身邊每天都好開心！',
    intimacyGain: 1,
    moodGain: 3,
    petAction: 'petted',
    expression: 'happyTongue',
  },
};

export function selectResponsesForDialogue(
  category: DialogueCategory,
  personality: PersonalityId,
  urgentStat?: 'hunger' | 'mood' | 'cleanliness' | 'energy',
  weather?: WeatherCondition
): DialogueResponse[] {
  if (category === 'urgent' && urgentStat) {
    if (urgentStat === 'hunger') {
      return personality === 'greedy'
        ? [QUICK_RESPONSES.pudding, QUICK_RESPONSES.meal, QUICK_RESPONSES.hug]
        : [QUICK_RESPONSES.meal, QUICK_RESPONSES.pudding, QUICK_RESPONSES.hug];
    }
    if (urgentStat === 'cleanliness') {
      return [QUICK_RESPONSES.bath, QUICK_RESPONSES.hug, QUICK_RESPONSES.sleep];
    }
    if (urgentStat === 'energy') {
      return [QUICK_RESPONSES.sleep, QUICK_RESPONSES.hug, QUICK_RESPONSES.pudding];
    }
    return [QUICK_RESPONSES.hug, QUICK_RESPONSES.walk, QUICK_RESPONSES.pudding];
  }

  if (category === 'weather' && weather) {
    if (weather === 'clear') {
      return personality === 'greedy'
        ? [QUICK_RESPONSES.walk, QUICK_RESPONSES.pudding, QUICK_RESPONSES.hug]
        : [QUICK_RESPONSES.walk, QUICK_RESPONSES.hug];
    }
    if (weather === 'rain' || weather === 'storm') {
      return [QUICK_RESPONSES.hug, QUICK_RESPONSES.bath, QUICK_RESPONSES.sleep];
    }
    return [QUICK_RESPONSES.hug, QUICK_RESPONSES.walk, QUICK_RESPONSES.sleep];
  }

  if (category === 'time') {
    return [QUICK_RESPONSES.walk, QUICK_RESPONSES.pudding, QUICK_RESPONSES.sleep];
  }

  switch (personality) {
    case 'greedy':
      return [QUICK_RESPONSES.pudding, QUICK_RESPONSES.hug, QUICK_RESPONSES.walk];
    case 'sleepy':
      return [QUICK_RESPONSES.sleep, QUICK_RESPONSES.hug];
    case 'clingy':
    case 'shy':
      return [QUICK_RESPONSES.hug, QUICK_RESPONSES.pudding, QUICK_RESPONSES.sleep];
    case 'elegant':
      return [QUICK_RESPONSES.bath, QUICK_RESPONSES.hug, QUICK_RESPONSES.walk];
    case 'lively':
    case 'mischievous':
    case 'curious':
      return [QUICK_RESPONSES.walk, QUICK_RESPONSES.hug, QUICK_RESPONSES.pudding];
    default:
      return [QUICK_RESPONSES.hug, QUICK_RESPONSES.walk, QUICK_RESPONSES.pudding];
  }
}

export const URGENT_DIALOGUES: Record<
  'hunger' | 'mood' | 'cleanliness' | 'energy',
  Record<PersonalityId, string>
> = {
  hunger: {
    greedy: '咕嚕嚕… 肚子快扁成紙片了！現在超想吃一口布丁或香噴噴料理！',
    sleepy: '唔… 餓到有點睡不著了… 可以吃點東西再繼續打盹嗎？',
    mischievous: '警報警報！胃袋空空抗議中～快餵我吃點好料不然要撒嬌搗蛋囉！',
    clingy: '肚子咕嚕叫了啦… 你有沒有聽到？快來餵我吃飯抱抱我！',
    elegant: '失禮了… 肚子稍微有些空呢，方便為我準備一份餐點嗎？',
    curious: '好奇怪喔，為什麼肚子裡面一直發出咕嚕咕嚕的聲音呢？好像是餓了！',
    lively: '嗚哇！能量燃料快見底啦！快補充美食讓我繼續活蹦亂跳！',
    shy: '那個… 不好意思… 我肚子好像有點餓了，可以吃一點點嗎？',
  },
  mood: {
    greedy: '心情有點低落… 如果有一小口甜點加上抱抱應該馬上就會好起來！',
    sleepy: '覺得悶悶的… 想窩在你懷裡安靜貼一會兒。',
    mischievous: '無聊到尾巴都打結了！快點陪我玩或摸摸我啦～',
    clingy: '好想你喔… 今天好像少了一點抱抱，可以貼緊緊嗎？',
    elegant: '偶爾也會覺得有些寂寞呢… 願意陪我聊聊、摸摸我的頭嗎？',
    curious: '總覺得今天提不起勁… 帶我出去看看新鮮事物或抱抱我好嗎？',
    lively: '嗚嗚～想要一起玩耍啦！自己一個人待著心情都灰灰的…',
    shy: '小聲說… 我有點沒精神，可以輕輕抱抱我嗎？',
  },
  cleanliness: {
    greedy: '剛才吃東西好像把嘴角弄黏黏了… 想洗個香香再繼續當吃貨！',
    sleepy: '身上有點黏答答的，洗完澡再鑽進乾淨棉被一定超好睡…',
    mischievous: '嘿嘿… 剛玩得滿身灰塵，好像該去洗澎澎變身小乾淨了！',
    clingy: '人家毛毛有點亂糟糟的了… 幫我洗香香之後再抱抱好嗎？',
    elegant: '保持整潔是很重要的禮儀呢，能麻煩幫我準備溫水泡泡澡嗎？',
    curious: '咦？為什麼身上黏著一片小葉子？我們來洗泡泡澡把它沖掉吧！',
    lively: '跑來跑去弄得灰撲撲了！快來幫我沖個痛快澡！',
    shy: '那個… 我身上好像有點髒髒的，有點害羞… 可以幫我洗澡嗎？',
  },
  energy: {
    greedy: '連做夢都想吃布丁… 可是眼皮已經重到睜不開了呼嚕…',
    sleepy: '哈欠… 已經撐不住了，好想馬上倒進小枕頭裡睡覺…',
    mischievous: '電量剩 1% 啦… 再不睡覺我連眨眼都要打瞌睡了…',
    clingy: '好睏喔… 可以邊拍拍我邊哄我睡覺嗎？',
    elegant: '今日的體力似乎快見底了，請容許我先休息片刻補充元氣。',
    curious: '想再多看看房間… 可是上下眼皮一直黏在一起了…',
    lively: '呼～玩太瘋突然沒電了！讓我小睡一下馬上復活！',
    shy: '唔… 我好想睡覺，先縮進被窩裡休息一下好嗎？',
  },
};

export const PERSONALITY_DIALOGUES: Record<PersonalityId, string[]> = {
  greedy: [
    '偷偷問一下，今天點心時間會有焦糖布丁或酥脆薯條嗎？',
    '只要聞到剛出爐的點心香味，我連作夢都會忍不住微笑呢！',
    '我覺得幸福的形狀，就是圓滾滾的布丁配上熱呼呼的食物！',
    '剛才我用鼻子偵測了一下，食堂方向好像飄來香香的味道喔！',
    '如果把零食藏在枕頭底下… 算了，我大概三分鐘就會吃光光！',
    '今天有沒有認真吃飯呀？要記得和我一起吃飽飽才有力氣！',
    '每次看到點心架我就會想：接下來要吃哪一個好呢～',
    '就算剛吃飽，我的第二個甜點胃永遠都還是空的喔！',
  ],
  sleepy: [
    '陽光暖暖的灑在地板上… 好適合把肚子曬得熱呼呼再午睡喔。',
    '哈欠～剛才做了一個軟綿綿的夢，夢裡有雲朵大枕頭！',
    '不用急著做什麼事，就這樣靜靜靠在一起休息也很棒呢…',
    '今天枕頭的蓬鬆度剛剛好，你要不要也靠過來瞇一下？',
    '如果世界是一張大棉被，我應該可以一直窩在裡面不出來吧…',
    '呼嚕… 聽到你的呼吸聲，我就覺得安心又想睡覺了。',
    '午睡前的儀式感，就是先在床上滾兩圈再蓋好被被！',
    '閉上眼睛聽風的聲音，好像整個小屋都慢了下來呢…',
  ],
  mischievous: [
    '嘿嘿，我剛才把一顆小球踢到角落，猜猜看等一下會滾去哪裡？',
    '偶爾偷偷跟你玩躲貓貓，你看得到我藏在哪裡嗎～',
    '今天心情好到想在房間原地轉三圈！要一起加入嗎？',
    '噓～我偷偷幫你的手背蓋了一個隱形的「最喜歡」印章喔！',
    '如果不理我的話… 我就要用軟軟的小臉頰蹭你的手直到你笑出來！',
    '猜猜我手裡有沒有藏小餅乾？哈哈，其實是滿滿的鬼點子！',
    '好想玩小遊戲喔～這次我一定會拿超級高分給你看！',
    '跳一下！再跳一下！今天就是要當房間裡最調皮的小可愛！',
  ],
  clingy: [
    '你剛才離開一下下，我就有點開始想你了呢…',
    '最喜歡被你輕輕摸頭了，感覺整顆心都融化了～',
    '如果可以的話，真想一天二十四小時都黏在你身邊！',
    '偷偷把臉頰靠過來～今天也可以一直貼貼嗎？',
    '只要你打開遊戲看我一眼，我一整天的心情都會變超好！',
    '記得有空要多跟我說說話或留小紙條給我喔，我都會記在心裡！',
    '牽牽小手好不好？有你在旁邊我就一點都不怕孤單！',
    '不管去做什麼，都要記得帶上我一起喔，好不好嘛～',
  ],
  elegant: [
    '今天把毛整理得柔順又有光澤，心情也跟著從容起來了呢。',
    '在微風輕拂的小屋裡喝杯下午茶，真是最愜意的時光呀。',
    '保持房間乾淨又飄著淡淡花香，是讓每一天都閃閃發亮的秘訣。',
    '謝謝你總是這麼細心照顧我，我也會好好維持可愛又端莊的模樣！',
    '照照鏡子的時候，發現你的眼光真的很棒呢，搭配得真好看。',
    '洗完香香之後伸個懶腰，感覺連空氣都變得更清新了。',
    '今天也想和氣質滿滿的你，一起度過優雅又療癒的一天！',
    '每件家具擺得整整齊齊的，看著就令人心情愉悅呢。',
  ],
  curious: [
    '咦？小屋的角落是不是多了一點不一樣的光影？我去看看！',
    '每次你添購新家具，我都會用鼻尖仔細研究它背後的秘密呢！',
    '好想知道農地裡的種子每天是怎麼一點一點長大的喔～',
    '你平常出門的時候，外面是不是也有好多有趣的新鮮事？跟我說嘛！',
    '我剛才數了數房間的地板格子，好像每個角度看都不太一樣呢！',
    '這個玩具從左邊看和從右邊看，感覺好像不太一樣耶，好神奇！',
    '不知道明天食堂或商店裡會出現什麼樣的新寶貝呢？好期待！',
    '只要發現沒見過的東西，我的眼睛就會瞬間亮起來！',
  ],
  lively: [
    '元氣滿滿報到！今天我們要挑戰哪一項好玩的事情呢？',
    '剛才我原地小跑了十步，現在熱身完畢隨時可以出發！',
    '有你在的時候電力永遠都是 100%！我們去散步或玩遊戲吧！',
    '哇哈哈！今天感覺可以跳得比昨天還要高喔，你看你看！',
    '待在原地腳底都開始癢癢了～一起動起來感覺最暢快！',
    '把快樂像彩虹球一樣彈來彈去，整個房間都充滿笑聲啦！',
    '不論晴天還是微風天，我都能把滿滿活力傳染給你喔！',
    '準備好了嗎？一、二、三，一起衝向開心的一天！',
  ],
  shy: [
    '那個… 你今天還好嗎？我有偷偷在心裡幫你加油喔…',
    '剛才一直不好意思開口，其實… 我很期待和你說說話呢。',
    '被你一直看著臉都紅紅的了啦… 不過很開心喔。',
    '有時候躲在小帳篷或抱枕後面偷看你，就會覺得好安心。',
    '雖然我不太會大聲表現，但每次你摸我我都記在心裡喔！',
    '小聲說… 如果你累了，隨時可以靠過來跟我一起休息。',
    '能遇見這麼溫柔照顧我的你，我真的覺得好幸運…',
    '輕輕牽住你的指尖一下下就好… 這樣就很有勇氣了！',
  ],
};

export const TIME_PERIOD_META: Record<
  TimePeriodId,
  { label: string; emoji: string }
> = {
  dawn: { label: '清晨', emoji: '🌅' },
  morning: { label: '上午', emoji: '☀️' },
  noon: { label: '中午', emoji: '🍱' },
  afternoon: { label: '下午', emoji: '🫖' },
  evening: { label: '傍晚', emoji: '🌇' },
  night: { label: '夜晚', emoji: '🌙' },
  late_night: { label: '深夜', emoji: '🌌' },
};

export const TIME_GREETINGS: Record<TimePeriodId, Record<PersonalityId, string>> = {
  dawn: {
    greedy: '早安！今天想吃紅蘿蔔沙拉，也想配一顆小布丁！',
    sleepy: '早安… 太陽剛出來暖暖的，還想再賴床五分鐘…',
    mischievous: '早安呀！我已經比太陽公公還早醒來在房間探險囉！',
    clingy: '早安！一睜開眼睛就看到你，今天一定是最棒的一天！',
    elegant: '早安，清晨的空氣真清新，一起迎接優雅的早晨吧。',
    curious: '早安！今天想吃紅蘿蔔沙拉，不知道清晨的農地有沒有露珠呢？',
    lively: '早安早安！清晨充滿朝氣，先吃份元氣早餐再動起來吧！',
    shy: '早安… 今天想吃紅蘿蔔沙拉。祝你有個溫柔的早晨喔…',
  },
  morning: {
    greedy: '上午好！點心雷達已經開機了，等等記得一起開飯喔！',
    sleepy: '早上的微風吹起來好舒服，伸個懶腰精神來囉～',
    mischievous: '上午好！趁著陽光正好，要不要先來玩一局小遊戲？',
    clingy: '早上好呀～忙起來之前先讓我蹭蹭充電一下嘛！',
    elegant: '美好的上午時光，房間整理好之後心情也特別明亮呢。',
    curious: '上午好！剛剛我看農田裡的作物好像又長高了一點點耶！',
    lively: '上午好！今天的太陽閃閃發光，超適合帶我出去跑一跑！',
    shy: '早安… 上午忙碌的話也要記得休息一下喝口水喔！',
  },
  noon: {
    greedy: '肚子有點餓了，可以吃午餐嗎？我最期待大口吃美食了！',
    sleepy: '肚子有點餓了，可以吃午餐嗎？吃飽正好可以睡個小午覺…',
    mischievous: '叮咚叮咚！午餐時間到～肚子有點餓了，可以吃午餐嗎？',
    clingy: '已經中午了耶！肚子有點餓了，可以陪我一起吃午餐嗎？',
    elegant: '午間時分到了，肚子有點餓了，可以一同享用午餐嗎？',
    curious: '肚子有點餓了，可以吃午餐嗎？好好奇今天中午吃什麼！',
    lively: '已經中午啦！肚子有點餓了，可以吃午餐補滿元氣嗎？',
    shy: '那個… 肚子有點餓了，可以吃午餐嗎？跟你一起吃最好吃了…',
  },
  afternoon: {
    greedy: '下午茶時間到囉！這時候來份甜點或小餅乾最對味了～',
    sleepy: '下午陽光斜斜的照進來… 好容易讓人犯睏的溫柔時段喔…',
    mischievous: '下午茶如果少了點小遊戲配著玩，感覺就不夠精采了對吧！',
    clingy: '午後有點想黏著你發呆呢，陪我窩在一起一會兒好不好？',
    elegant: '悠閒的午後時光，最適合泡一壺花茶配水果慢慢品嘗呢。',
    curious: '下午的光線照在家具上好好看喔，要不要幫房間換個小角落？',
    lively: '午休結束！下午還有滿滿精力，一起去農地逛逛或散步吧！',
    shy: '午後安安… 輕輕靠在你身邊看著時間慢慢流過就好幸福。',
  },
  evening: {
    greedy: '晚上適合散步，我們去公園吧！順便聞聞晚餐的香氣！',
    sleepy: '傍晚的天空變成橘粉色的好溫柔… 晚上適合散步，我們去公園吧！',
    mischievous: '夕陽出現了！晚上適合散步，我們去公園吧～看看有沒有小蝴蝶！',
    clingy: '牽好小手喔～晚上適合散步，我們去公園吧！',
    elegant: '黃昏微風正好，晚上適合散步，我們去公園漫步一番吧！',
    curious: '晚上適合散步，我們去公園吧！想看看傍晚的小路長什麼樣子！',
    lively: '晚上適合散步，我們去公園吧！出去跑一圈回來剛好開飯！',
    shy: '夕陽好漂亮… 晚上適合散步，我們去公園吧，我會緊緊跟著你的。',
  },
  night: {
    greedy: '今天辛苦了，我想早點睡覺… 睡前可以偷想一下明天的早餐嗎？',
    sleepy: '今天辛苦了，我想早點睡覺。軟軟的被被已經準備好了呼嚕…',
    mischievous: '今天辛苦了，我想早點睡覺！明天再繼續跟你玩好多遊戲～',
    clingy: '今天辛苦了，我想早點睡覺。睡前別忘了再抱抱我喔！',
    elegant: '今天辛苦了，我想早點睡覺，祝我們都有個安穩香甜的好夢。',
    curious: '今天辛苦了，我想早點睡覺！不知道今晚會做什麼奇妙的夢呢？',
    lively: '玩了一整天好充實！今天辛苦了，我想早點睡覺充飽明天的電！',
    shy: '今天辛苦了，我想早點睡覺。晚安喔… 謝謝你今天陪著我。',
  },
  late_night: {
    greedy: '這麼晚還沒睡嗎？我陪著你… 餓了的話記得也要吃點暖胃的東西喔！',
    sleepy: '唔… 這麼晚還沒睡嗎？我陪著你，眼皮快撐不住也要守著你…',
    mischievous: '夜貓子秘密基地開張！這麼晚還沒睡嗎？我陪著你喔！',
    clingy: '這麼晚還沒睡嗎？我陪著你，不准自己一個人熬夜寂寞喔！',
    elegant: '夜深了呢… 這麼晚還沒睡嗎？我陪著你，忙完就早點休息吧。',
    curious: '深夜的星星好安靜喔… 這麼晚還沒睡嗎？我陪著你一起看夜空。',
    lively: '雖然已經深夜了，但只要你在我就有精神！這麼晚還沒睡嗎？我陪著你！',
    shy: '小聲說… 這麼晚還沒睡嗎？我陪著你，不會吵到你的…',
  },
};

export const WEATHER_META: Record<
  WeatherCondition,
  { label: string; emoji: string; defaultTempC: number }
> = {
  clear: { label: '晴天', emoji: '☀️', defaultTempC: 24 },
  cloudy: { label: '多雲', emoji: '⛅', defaultTempC: 21 },
  rain: { label: '下雨', emoji: '🌧️', defaultTempC: 18 },
  snow: { label: '下雪', emoji: '❄️', defaultTempC: 1 },
  storm: { label: '雷雨', emoji: '⛈️', defaultTempC: 17 },
  hot: { label: '炎熱', emoji: '🌡️', defaultTempC: 32 },
  windy: { label: '微風陣陣', emoji: '🍃', defaultTempC: 20 },
};

export const WEATHER_DIALOGUES: Record<WeatherCondition, string[]> = {
  clear: [
    '今天大晴天太陽公公露臉了！好適合牽著手出去散步喔～',
    '晴天陽光暖洋洋的，去散步心情會加倍好喔！',
    '晴空萬里沒有半朵烏雲，農地裡的作物肯定也在開心曬太陽呢！',
    '這種好天氣待在室內太可惜了啦～我們去散步吹吹微風吧！',
  ],
  cloudy: [
    '今天是舒爽的陰涼多雲天，不出汗又舒服呢～',
    '雲朵像大棉花糖一樣飄在天空上，看著就讓人嘴饞…',
    '多雲的天氣不刺眼，在小屋窗邊發呆剛剛好呢。',
    '涼涼的多雲天，不管散步或在家整理房間都很愜意喔！',
  ],
  rain: [
    '外面滴滴答答在下雨呢… 這種天氣最推薦待在家洗澡或窩被窩睡覺！',
    '下雨天最適合待在家裡洗澎澎、聽著雨聲暖暖地打瞌睡了～',
    '玻璃窗上有小水珠在賽跑耶，今天我們就待在小屋裡慢慢相處吧！',
    '下雨出門會弄濕毛毛，在家陪我吃點心、休息充電最棒了！',
  ],
  snow: [
    '哇！外面飄起白茫茫的小雪花了，整個世界好像灑滿糖霜喔！',
    '下雪天冷颼颼的，好想把暖暖的圍巾裹緊緊貼在你旁邊～',
    '雪花一片一片飄下來好夢幻喔，今天喝熱湯最幸福了！',
    '冰涼涼的雪天裡，屋子裡卻暖呼呼的，感覺好療癒呀！',
  ],
  storm: [
    '轟隆隆… 外面打雷下大雨了，聲音好大有點怕怕的… 可以摸摸我嗎？',
    '雷雨天閃電好亮喔… 趕快抱抱我，只要你摸摸我的頭我就不怕了！',
    '大雨一直下個不停，還好我們在堅固溫暖的小屋裡互相陪伴…',
    '嗚… 剛剛的雷聲嚇我一跳！靠在你旁邊摸摸背才安心一點…',
  ],
  hot: [
    '今天太陽好熱情喔，記得要多喝水，吃份清爽的水果盒剛剛好！',
    '熱呼呼的天氣就想吃冰涼薄荷聖代或待在涼爽的小屋乘涼～',
    '外面好曬喔，還好小屋裡通風又舒適，洗完澡肯定超涼快！',
    '炎熱的夏天要注意補水喔，我有乖乖躲在陰涼處休息！',
  ],
  windy: [
    '呼～外面風好大喔，耳朵跟頭髮差點都要飛起來了！',
    '涼爽的風陣陣吹進來，把小屋裡吹得乾乾淨淨好舒服！',
    '風吹過草地的聲音沙沙作響，好像在跟我們打招呼呢！',
    '吹風的時候跑起來感覺自己都要變成小風箏了啦！',
  ],
};

export const PERSONALITY_WEATHER_OVERRIDES: Partial<
  Record<WeatherCondition, Partial<Record<PersonalityId, string>>>
> = {
  rain: {
    greedy: '下雨就不能去買薯條了嗎？好想在家裡自己炸熱呼呼的薯條喔…',
    sleepy: '下雨天最適合窩在毯子裡睡覺。聽著雨聲一下就入夢鄉了呼嚕…',
    lively: '下雨也要出去踩水坑！雖然等一下回來還要洗澡也沒關係啦！',
    mischievous: '雨滴敲在窗戶上的節奏好好玩，我們來在家玩小遊戲吧！',
    clingy: '下雨天外面灰灰的，今天可以整天待在家跟我貼緊緊嗎？',
    elegant: '雨聲淅瀝瀝的，最適合待在屋裡洗個芳香泡泡澡了呢。',
    curious: '好好奇雨水最後都流到哪裡去了喔？會流去澆灌我們的農地嗎？',
    shy: '雨聲好大喔… 待在溫暖的家裡躲在抱枕後面感覺好安心。',
  },
  snow: {
    greedy: '雪看起來好像白色的綿綿冰或糖粉喔… 好想吃一口味覺一定超棒！',
    sleepy: '下雪天冷呼呼的，最棒的事就是包得像麻糬一樣在床上冬眠！',
    mischievous: '好想堆一隻長得像你的小雪人，再偷偷給牠戴上小紅帽！',
    clingy: '外面下雪好冷喔，快把手伸進我懷裡取暖貼緊緊！',
    elegant: '銀白色的雪景真如畫一般優雅，屋內泡壺熱茶再適合不過了。',
    curious: '每一片雪花的形狀據說都不一樣耶！好想拿小鏡子接一片看！',
    lively: '下雪了耶！！好想去雪地裡滾來滾去打雪仗喔！',
    shy: '下雪了… 臉頰被冷風吹得紅紅的，想輕輕握住你溫暖的手。',
  },
  storm: {
    greedy: '打雷聲音好嚇人喔… 摸摸我再塞給我一小塊餅乾壯壯膽好嗎？',
    sleepy: '雷聲吵到沒辦法好好睡覺… 幫我拍拍背哄我入睡好不好？',
    lively: '就算平常再勇敢，聽到這麼大聲的打雷還是會抖一下啦… 快摸摸我！',
    shy: '嗚哇… 閃電好可怕！我躲到你身後了，可以一直摸摸我的頭嗎？',
  },
  clear: {
    greedy: '晴天出門散步的話，說不定回程還可以順便帶一份點心回家呢！',
    lively: '晴天萬歲！今天出門散步一定能發現雙倍的快樂！',
    elegant: '晴朗的好天氣配上微風，非常適合換上漂亮配件出去散步呢。',
  },
};

export function buildMemoryDialogueText(
  event: PetMemoryEvent,
  petSpecies: PetSpecies,
  personality: PersonalityId,
  todayKey: string
): string {
  const isYesterday = event.dateKey !== todayKey;
  const actor = event.actorName?.trim() || '夥伴';

  if (event.type === 'partnerMessage') {
    return `有人留言給你了！${actor}剛才在留言板留下暖心的話，快去看看吧！`;
  }

  if (event.type === 'partnerFed') {
    const foodLabel = event.detail || '美味料理';
    return `剛剛有人餵我吃${foodLabel}！${actor}對我好好喔，吃得超滿足！`;
  }

  if (event.type === 'newRoomItem' && event.isCoopHighlight) {
    const itemLabel = event.detail || '新家具';
    return `家裡有新東西了！${actor}剛剛幫小屋添置了「${itemLabel}」，快進來看看！`;
  }

  if (event.type === 'fedFavoriteFood') {
    if (isYesterday) {
      if (personality === 'greedy') {
        return `昨天吃的「${event.detail}」到現在還忘不了那個香味！今天還能再吃一次嗎？`;
      }
      return `昨天你餵我吃的「${event.detail}」真的太美味了，今天想起來還是好幸福！`;
    }
    return personality === 'greedy'
      ? `剛才那份「${event.detail}」根本是宇宙級美食！我還要再回味十遍！`
      : `剛才吃到最愛的「${event.detail}」，心花怒放的幸福感還在冒泡泡呢！`;
  }

  if (event.type === 'fedDislikedFood') {
    return personality === 'shy'
      ? `剛才的「${event.detail}」雖然有點不合口味，但謝謝你餵我，我還是努力吃光了喔！`
      : `剛才那份「${event.detail}」味道有點特別呢… 下次可以換我喜歡吃的嗎？`;
  }

  if (event.type === 'petted') {
    return personality === 'clingy'
      ? '剛才被你溫柔摸摸的時候，幸福到真想把時間暫停下來！'
      : '剛才被你輕輕摸了摸，感覺整隻都鬆軟軟的好治癒～';
  }

  if (event.type === 'bathed') {
    return personality === 'elegant'
      ? '剛洗完香噴噴的泡泡澡，現在連走路都覺得特別優雅清爽！'
      : '洗完澡全身香噴噴又蓬鬆鬆的，快來聞聞看嘛！';
  }

  if (event.type === 'walked') {
    return personality === 'lively'
      ? '剛剛出門散步吹吹風超舒暢的！精神百倍！'
      : '剛才一起散步看到的風景真可愛，回味起來還是好開心～';
  }

  if (event.type === 'slept') {
    return '剛剛睡了個又香又甜的好覺，現在元氣滿滿啦！';
  }

  if (event.type === 'newAccessory') {
    return `剛換上的「${event.detail}」好時髦喔～覺得自己變得更可愛了嗎？`;
  }

  if (event.type === 'newRoomItem') {
    return `家裡多了「${event.detail}」耶！剛剛忍不住繞著它看了好久！`;
  }

  if (event.type === 'weightLogged') {
    return `剛量完體重是 ${event.detail}！每一點成長都是你細心照顧的證明喔！`;
  }

  if (event.type === 'stuffed') {
    return petSpecies === 'pig'
      ? '呼嚕… 剛剛不小心連吃太多速食肚子圓滾滾的，陪我走走消化一下好嗎？'
      : '剛才吃得太飽太撐了… 現在揉揉肚肚休息一下比較舒服～';
  }

  return `太棒了！我們達成新里程碑：${event.detail}！想跟你擊掌慶祝！`;
}

export interface HolidayRule {
  mmdd: string;
  name: string;
  line: string;
}

export const HOLIDAY_RULES: HolidayRule[] = [
  { mmdd: '01-01', name: '元旦新年', line: '新年快樂！！新的一年也要每天一起在小屋吃飽飽、睡香香喔！' },
  { mmdd: '02-14', name: '情人節', line: '祝你甜甜蜜蜜～今天是充滿粉紅愛心的日子，我要給你大大的擁抱！' },
  { mmdd: '04-04', name: '兒童節', line: '今天好像可以理直氣壯地當永遠長不大的小寶貝，陪我玩遊戲吧！' },
  { mmdd: '10-31', name: '萬聖節', line: '不給布丁就搗蛋～嘿嘿，今天的小屋是不是充滿神秘可愛的氣氛呢！' },
  { mmdd: '12-25', name: '聖誕節', line: '叮叮噹！聖誕快樂～你就是我每年最想要的溫暖禮物喔！' },
  { mmdd: '12-31', name: '跨年夜', line: '今年謝謝你每天這麼用心陪伴我！明年我們也要一直在一起喔！' },
];

export const DAILY_CHATTER_LINES: string[] = [
  '今天小屋的氣氛特別溫暖呢，你在做什麼呢？',
  '偷偷告訴你，只要看到你打開螢幕，我的心情就會立刻加分！',
  '有時候發發呆、看看你整理食堂與農場，也是一種小確幸喔！',
  '你今天過得好嗎？不管累不累，這裡永遠都有我陪著你喔！',
  '剛剛聽到窗外好像有小鳥啾啾叫，不知道是不是在誇獎我很可愛？',
  '每天的小小日常累積起來，就是我們最閃閃發亮的成長紀錄呢！',
  '偶爾放慢腳步深呼吸一下吧，我會在這裡一直等你回來喔！',
  '不知道等一下要不要去農場看看種子長大了沒，順便做個小料理？',
];
