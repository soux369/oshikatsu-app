export interface Member {
    id: string; // YouTube Channel ID
    name: string;
    color: string; // Theme color for UI
}

export const AOGIRI_MEMBERS: Member[] = [
    { id: 'UCt7_srJeiw55kTcK7M9ID6g', name: '音霊 魂子', color: '#9575CD' },
    { id: 'UC7wZb5INldbGweowOhBIs8Q', name: '石狩 あかり', color: '#FF8A65' },
    { id: 'UCs-lYkwb-NYKE9_ssTRDK3Q', name: '山黒 音玄', color: '#9E9E9E' },
    { id: 'UCXXnWssOLdB2jg-4CznteAA', name: '栗駒 こまる', color: '#FFF176' },
    { id: 'UCyY6YeINiwQoA-FnmdQCkug', name: '千代浦 蝶美', color: '#F06292' },
    { id: 'UCFvEuP2EDkvrgJpHI6-pyNw', name: '我部 りえる', color: '#FFCDD2' },
    { id: 'UCAHXqn4nAd2j3LRu1Qyi_JA', name: 'エトラ', color: '#FFCC80' },
    { id: 'UCmiYJycZXBGc4s_zjIRUHhQ', name: '春雨 麗女', color: '#64B5F6' },
    { id: 'UC1sBUU-y9FlHNukwsrR4bmA', name: 'ぷわぷわぽぷら', color: '#FFD54F' }, // Corrected ID
    { id: 'UCIwHOJn_3QjBTwQ_gNj7WRA', name: '萌実', color: '#AED581' },
    { id: 'UCxy3KNlLQiN64tikKipnQNg', name: '月赴 ゐぶき', color: '#8D6E63' },
    { id: 'UCdi5pj0MDQ-3LFNUFIFmD8w', name: 'うる虎 がーる', color: '#FFB74D' },
    { id: 'UCXXlhNCp1EPbDQ2pzmmy9aw', name: '八十科 むじな', color: '#90A4AE' },
    { id: 'UCPLeqi7rIqS9uY4_TrSUOMg', name: 'あおぎり高校 公式', color: '#29B6F6' }
];

export const getMemberById = (id: string): Member | undefined => {
    return AOGIRI_MEMBERS.find(m => m.id === id);
};
