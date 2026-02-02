import { COLORS } from './theme';

export interface Member {
    id: string; // YouTube Channel ID
    name: string;
    color: string; // Theme color for UI
}

export const AOGIRI_MEMBERS: Member[] = [
    { id: 'UCt7_srJeiw55kTcK7M9ID6g', name: '音霊 魂子', color: COLORS.tamako },
    { id: 'UC7wZb5INldbGweowOhBIs8Q', name: '石狩 あかり', color: COLORS.akari },
    { id: 'UCs-lYkwb-NYKE9_ssTRDK3Q', name: '山黒 音玄', color: COLORS.nekuro },
    { id: 'UCXXnWssOLdB2jg-4CznteAA', name: '栗駒 こまる', color: COLORS.komaru },
    { id: 'UCyY6YeINiwQoA-FnmdQCkug', name: '千代浦 蝶美', color: COLORS.chiyomi },
    { id: 'UCFvEuP2EDkvrgJpHI6-pyNw', name: '我部 りえる', color: COLORS.rieru },
    { id: 'UCAHXqn4nAd2j3LRu1Qyi_JA', name: 'エトラ', color: COLORS.etra },
    { id: 'UCmiYJycZXBGc4s_zjIRUHhQ', name: '春雨 麗女', color: COLORS.urame },
    { id: 'UC7u_W9WfB_g35m9nK_S460w', name: 'ぷわぷわぽぷら', color: '#ffcc00' }, // 卒業済みだがアーカイブはある
    { id: 'UCIwHOJn_3QjBTwQ_gNj7WRA', name: '萌実', color: '#ff99cc' },
    { id: 'UCxy3KNlLQiN64tikKipnQNg', name: '月赴 ゐぶき', color: '#66ccff' },
    { id: 'UCdi5pj0MDQ-3LFNUFIFmD8w', name: 'うる虎 がーる', color: '#ff6600' },
    { id: 'UCXXlhNCp1EPbDQ2pzmmy9aw', name: '八十科 むじな', color: '#888888' },
    { id: 'UCPLeqi7rIqS9uY4_TrSUOMg', name: 'あおぎり高校 公式', color: '#00AAFF' } // Correct ID
];

export const getMemberById = (id: string): Member | undefined => {
    return AOGIRI_MEMBERS.find(m => m.id === id);
};
