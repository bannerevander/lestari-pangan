/**
 * Katalog resep demo (R02–R06). Inspirasi olahan, bukan penilaian keamanan pangan.
 * `uses` dipakai untuk mencocokkan bahan yang dimiliki pengguna.
 */

export interface RecipeStep {
  title: string
  minutes: number
  body: string
  tip?: string
}

export interface Recipe {
  id: string
  title: string
  summary: string
  category: string
  minutes: number
  portions: string
  level: 'Mudah' | 'Sedang'
  tool: string
  uses: string[]
  have: { name: string; amount: string }[]
  extra: string[]
  steps: RecipeStep[]
  safety: string
  status: 'Tersedia' | 'Ditinjau ulang'
}

export const recipes: Recipe[] = [
  {
    id: 'nasi-goreng-sayur',
    title: 'Nasi goreng kampung sayur',
    summary: 'Manfaatkan nasi dingin dan batang sayur yang renyah tanpa minyak berlebih.',
    category: 'Olahan nasi',
    minutes: 15,
    portions: '2 porsi',
    level: 'Mudah',
    tool: 'Wajan',
    uses: ['nasi', 'wortel', 'sawi', 'buncis'],
    have: [
      { name: 'Nasi matang dingin', amount: '2 porsi (±300 g)' },
      { name: 'Wortel, serut', amount: '1 buah' },
      { name: 'Batang sawi atau buncis', amount: '1 genggam' },
    ],
    extra: ['2 siung bawang putih', '1 sdm minyak', '½ sdt garam dan merica', '1 sdm kecap (opsional)'],
    steps: [
      { title: 'Siapkan bahan', minutes: 3, body: 'Iris bawang putih, serut wortel, dan potong batang sayur 0,5 cm. Urai nasi dingin dengan tangan bersih agar tidak menggumpal.' },
      { title: 'Tumis bumbu dan sayur keras', minutes: 3, body: 'Panaskan minyak dengan api sedang. Tumis bawang putih hingga harum, lalu masukkan wortel dan batang sayur.', tip: 'Daun sayur dimasukkan belakangan supaya tidak layu berlebihan.' },
      { title: 'Masukkan nasi dan bumbu', minutes: 5, body: 'Masukkan nasi, aduk rata, beri garam, merica, dan kecap. Masak hingga nasi panas merata sampai ke tengah.' },
      { title: 'Sajikan', minutes: 2, body: 'Cicipi, sesuaikan rasa, lalu sajikan selagi hangat. Habiskan dalam satu kali makan.' },
    ],
    safety: 'Pastikan nasi disimpan tertutup di kulkas. Jangan dipakai bila berlendir atau berbau asam.',
    status: 'Tersedia',
  },
  {
    id: 'sup-bening-sayur',
    title: 'Sup bening sayur',
    summary: 'Rebusan segar untuk menghabiskan potongan wortel dan sawi.',
    category: 'Kuah hangat',
    minutes: 20,
    portions: '3–4 porsi',
    level: 'Mudah',
    tool: 'Panci',
    uses: ['wortel', 'sawi', 'buncis', 'tahu'],
    have: [
      { name: 'Wortel, potong bulat', amount: '1 buah' },
      { name: 'Sawi atau buncis', amount: '2 genggam' },
    ],
    extra: ['1 liter air', '2 siung bawang putih', 'Daun bawang', 'Garam dan lada'],
    steps: [
      { title: 'Didihkan air dan bumbu', minutes: 5, body: 'Didihkan air bersama bawang putih geprek.' },
      { title: 'Masak sayur keras', minutes: 8, body: 'Masukkan wortel, masak hingga empuk.' },
      { title: 'Masukkan sayur hijau', minutes: 4, body: 'Masukkan sawi atau buncis, beri garam dan lada.' },
      { title: 'Sajikan', minutes: 3, body: 'Taburi daun bawang dan sajikan hangat.' },
    ],
    safety: 'Rebus hingga mendidih merata. Simpan sisa sup di kulkas dan panaskan kembali sebelum dimakan.',
    status: 'Tersedia',
  },
  {
    id: 'bola-nasi-renyah',
    title: 'Bola nasi renyah',
    summary: 'Nasi sisa dan wortel cincang jadi camilan renyah untuk anak.',
    category: 'Kudapan',
    minutes: 25,
    portions: '4 porsi',
    level: 'Sedang',
    tool: 'Wajan',
    uses: ['nasi', 'wortel', 'telur'],
    have: [
      { name: 'Nasi dingin', amount: '2 porsi' },
      { name: 'Wortel, cincang halus', amount: '½ buah' },
    ],
    extra: ['3 sdm tepung terigu', '1 butir telur (opsional)', 'Garam', 'Minyak untuk menggoreng'],
    steps: [
      { title: 'Campur adonan', minutes: 6, body: 'Campur nasi, wortel, tepung, garam, dan telur. Uleni hingga bisa dibentuk.' },
      { title: 'Bentuk bola', minutes: 7, body: 'Bentuk bola seukuran kelereng besar dengan tangan sedikit basah.' },
      { title: 'Goreng', minutes: 10, body: 'Goreng dengan api sedang hingga kuning keemasan. Tiriskan.', tip: 'Api terlalu besar membuat luar gosong tapi tengah belum matang.' },
      { title: 'Sajikan', minutes: 2, body: 'Sajikan hangat. Cocok dengan saus tomat.' },
    ],
    safety: 'Pastikan bagian tengah matang merata. Perhatikan alergi telur dan gluten.',
    status: 'Tersedia',
  },
  {
    id: 'puding-roti',
    title: 'Puding roti panggang kayu manis',
    summary: 'Pinggiran roti tawar sisa menjadi hidangan penutup wangi.',
    category: 'Olahan roti',
    minutes: 35,
    portions: '4 porsi',
    level: 'Sedang',
    tool: 'Oven',
    uses: ['roti'],
    have: [{ name: 'Roti tawar atau pinggirannya', amount: '6 lembar' }],
    extra: ['400 ml susu', '2 butir telur', '3 sdm gula', '½ sdt kayu manis'],
    steps: [
      { title: 'Potong roti', minutes: 5, body: 'Potong roti kotak-kotak, susun di loyang.' },
      { title: 'Buat campuran susu', minutes: 5, body: 'Kocok susu, telur, gula, dan kayu manis.' },
      { title: 'Rendam', minutes: 5, body: 'Tuang ke atas roti, diamkan hingga meresap.' },
      { title: 'Panggang', minutes: 20, body: 'Panggang 180°C sampai permukaan kecokelatan dan bagian tengah set.' },
    ],
    safety: 'Gunakan roti yang belum berjamur. Simpan sisa puding di kulkas maksimal 2 hari.',
    status: 'Tersedia',
  },
  {
    id: 'tumis-jamur',
    title: 'Tumis jamur tiram pedas manis',
    summary: 'Sedang ditarik sementara untuk pembaruan takaran oleh tim kurasi.',
    category: 'Tumisan',
    minutes: 15,
    portions: '2 porsi',
    level: 'Mudah',
    tool: 'Wajan',
    uses: ['jamur'],
    have: [],
    extra: [],
    steps: [],
    safety: '',
    status: 'Ditinjau ulang',
  },
]

/** Skor cocok sederhana: berapa banyak bahan resep yang dimiliki pengguna. */
export function matchRecipes(items: string[], tools: string[], list: Recipe[] = recipes) {
  const have = items.map((i) => i.toLowerCase())
  return list
    .filter((r) => r.status === 'Tersedia' && tools.includes(r.tool))
    .map((r) => {
      const hits = r.uses.filter((u) => have.some((h) => h.includes(u)))
      return { recipe: r, hits, score: Math.round((hits.length / r.uses.length) * 100) }
    })
    .filter((m) => m.hits.length > 0)
    .sort((a, b) => b.score - a.score)
}
