export interface Member {
    id: string; // YouTube Channel ID
    name: string;
    color: string; // Theme color for member
}

export const AOGIRI_MEMBERS: Member[] = [
    { id: 'UCPG_p9shR2IdjUjvyO03pRA', name: '音霊 魂子', color: '#ffcc00' },
    { id: 'UC1YvO_6YI8GisE0pT606S-A', name: '石狩 あかり', color: '#ff3366' },
    { id: 'UCR_6MvSPrTzG_U_Xv-vX_fA', name: '大代 真白', color: '#ffffff' },
    { id: 'UCl_V378ZvT9V6U_f9mS8A-g', name: '山黒 音玄', color: '#333333' },
    { id: 'UC_8O_uS9_p9x_-w8I8yv8Cg', name: '栗駒 こまる', color: '#ff6600' },
    { id: 'UCV_r_p7_S8r-s-S7p9G_v8Q', name: '千代浦 蝶美', color: '#cc00ff' },
    { id: 'UC-p7_S8r-s-S7p9G_v8Q', name: '我部 りあ', color: '#00ccff' },
    { id: 'UC0_S8r-s-S7p9G_v8Q', name: 'エトラ', color: '#00ffcc' },
];

export const getMemberById = (id: string) => AOGIRI_MEMBERS.find(m => m.id === id);
export const CHANNEL_IDS = AOGIRI_MEMBERS.map(m => m.id);
