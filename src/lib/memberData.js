const SHEET_ID = '1ggEcag8cSutBlAoNff4slIL4RG-FwkhElPw3YSCWgao';

export async function getMemberList() {
  // CSV形式でデータを取得（API不要）
  const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

  try {
    const response = await fetch(CSV_URL, {
      mode: 'cors',
      headers: {
        'Accept': 'text/csv'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();

    // CSV を配列に変換
    const rows = csvText.split('\n').filter(row => row.trim());

    if (rows.length <= 1) {
      return [];
    }

    // 1行目（ヘッダー）を除外して返す
    return rows.slice(1).map(row => {
      const cols = row.split(',').map(cell => cell.replace(/"/g, '').trim());
      return {
        uid: cols[0] || '',
        name: cols[1] || '',
        pref: cols[2] || '',
        type: cols[3] || ''
      };
    }).filter(member => member.name); // 名前が空でないもののみ

  } catch (error) {
    console.error('メンバーデータ取得エラー:', error);
    return [];
  }
}
