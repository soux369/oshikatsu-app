export interface Member {
    id: string; // YouTube Channel ID
    name: string;
    color: string; // Theme color for member
}

export const AOGIRI_MEMBERS: Member[] = [
    { id: 'UCt7_srJeiw55kTcK7M9ID6g', name: '音霊 魂子', color: '#ffcc00' },
    { id: 'UC7wZb5INldbGweowOhBIs8Q', name: '石狩 あかり', color: '#ff3366' },
    { id: 'UCs-lYkwb-NYKE9_ssTRDK3Q', name: '山黒 音玄', color: '#333333' },
    { id: 'UCXXnWssOLdB2jg-4CznteAA', name: '栗駒 こまる', color: '#ff6600' },
    { id: 'UCyY6YeINiwQoA-FnmdQCkug', name: '千代浦 蝶美', color: '#cc00ff' },
    { id: 'UCFvEuP2EDkvrgJpHI6-pyNw', name: '我部 りえる', color: '#00ccff' },
    { id: 'UCAHXqn4nAd2j3LRu1Qyi_JA', name: 'エトラ', color: '#00ffcc' },
    { id: 'UCmiYJycZXBGc4s_zjIRUHhQ', name: '春雨 麗女', color: '#ff0000' }, // Assuming Red-ish
    { id: 'UC7u_W9WfB_g35m9nK_S460w', name: 'ぷわぷわぽぷら', color: '#008000' }, // Green
    { id: 'UCIwHOJn_3QjBTwQ_gNj7WRA', name: '萌実', color: '#ff99cc' }, // Pink
    { id: 'UCxy3KNlLQiN64tikKipnQNg', name: '月赴 ゐぶき', color: '#800000' }, // Maroon
    { id: 'UCdi5pj0MDQ-3LFNUFIFmD8w', name: 'うる虎 がーる', color: '#ffaa00' }, // Tiger Orange
    { id: 'UCXXlhNCp1EPbDQ2pzmmy9aw', name: '八十科 むじな', color: '#000080' }, // Navy
    { id: 'UCPLeqi7rIqS5CFl0_5-pkNw', name: 'あおぎり高校 公式', color: '#2b2b2b' }, // Official
];

export const getMemberById = (id: string) => AOGIRI_MEMBERS.find(m => m.id === id);
export const CHANNEL_IDS = AOGIRI_MEMBERS.map(m => m.id);
