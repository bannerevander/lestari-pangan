-- Data awal engagement (tips, resep, challenge, paket reward) dan Realtime untuk notifikasi.
-- Konten disalin dari katalog front end (src/data/mock.ts, src/data/recipes.ts) agar aplikasi live tidak kosong.
-- Idempoten: aman dijalankan ulang (on conflict / where not exists).

-- 1. Konten: Tips body = paragraf; Resep body = porsi, tingkat, alat, bahan, langkah, keamanan.
insert into public.contents (slug, kind, title, category, summary, body, minutes, photo_path, status)
values
  ('catatan-sederhana', 'Tips', 'Mulai dari catatan sederhana', 'Perencanaan', 'Catat bahan yang ada, lalu rencanakan penggunaannya.', '["Sebelum belanja atau memasak, lihat dulu bahan yang masih tersedia. Catatan singkat membantu Anda tahu apa yang perlu dipakai lebih dulu.","Tulis nama bahan, jumlah, dan tempat penyimpanannya. Jumlah perkiraan boleh, asalkan diberi tanda perkiraan.","Gunakan catatan itu saat merencanakan menu atau menawarkan surplus, supaya informasi tidak perlu diketik ulang."]'::jsonb, 3, 'img/tips-sayur.png', 'Terbit'),
  ('simpan-sayur', 'Tips', 'Simpan sayur berdaun di chiller', 'Penyimpanan', 'Bungkus dengan kain atau tisu kering agar tidak cepat layu.', '["Sayur berdaun cepat layu jika terlalu lembap. Keringkan setelah dicuci atau simpan sebelum dicuci.","Bungkus dengan kain bersih atau tisu kering, lalu masukkan ke wadah berlubang di chiller."]'::jsonb, 2, null, 'Terbit'),
  ('label-donasi', 'Tips', 'Tulis label informasi donasi', 'Donasi', 'Nama pangan, waktu persiapan, dan bahan yang diketahui.', '["Label membantu penerima memeriksa pangan saat serah terima. Tulis nama, waktu persiapan atau pembukaan, dan bahan yang diketahui.","Jika ada bahan yang belum diketahui, tulis \"belum diketahui\". Jangan menulis \"tanpa alergen\" bila belum pasti."]'::jsonb, 2, null, 'Terbit'),
  ('nasi-goreng-sayur', 'Resep', 'Nasi goreng kampung sayur', 'Olahan nasi', 'Manfaatkan nasi dingin dan batang sayur yang renyah tanpa minyak berlebih.', '{"portions":"2 porsi","level":"Mudah","tool":"Wajan","uses":["nasi","wortel","sawi","buncis"],"have":[{"name":"Nasi matang dingin","amount":"2 porsi (±300 g)"},{"name":"Wortel, serut","amount":"1 buah"},{"name":"Batang sawi atau buncis","amount":"1 genggam"}],"extra":["2 siung bawang putih","1 sdm minyak","½ sdt garam dan merica","1 sdm kecap (opsional)"],"steps":[{"title":"Siapkan bahan","minutes":3,"body":"Iris bawang putih, serut wortel, dan potong batang sayur 0,5 cm. Urai nasi dingin dengan tangan bersih agar tidak menggumpal."},{"title":"Tumis bumbu dan sayur keras","minutes":3,"body":"Panaskan minyak dengan api sedang. Tumis bawang putih hingga harum, lalu masukkan wortel dan batang sayur.","tip":"Daun sayur dimasukkan belakangan supaya tidak layu berlebihan."},{"title":"Masukkan nasi dan bumbu","minutes":5,"body":"Masukkan nasi, aduk rata, beri garam, merica, dan kecap. Masak hingga nasi panas merata sampai ke tengah."},{"title":"Sajikan","minutes":2,"body":"Cicipi, sesuaikan rasa, lalu sajikan selagi hangat. Habiskan dalam satu kali makan."}],"safety":"Pastikan nasi disimpan tertutup di kulkas. Jangan dipakai bila berlendir atau berbau asam."}'::jsonb, 15, null, 'Terbit'),
  ('sup-bening-sayur', 'Resep', 'Sup bening sayur', 'Kuah hangat', 'Rebusan segar untuk menghabiskan potongan wortel dan sawi.', '{"portions":"3–4 porsi","level":"Mudah","tool":"Panci","uses":["wortel","sawi","buncis","tahu"],"have":[{"name":"Wortel, potong bulat","amount":"1 buah"},{"name":"Sawi atau buncis","amount":"2 genggam"}],"extra":["1 liter air","2 siung bawang putih","Daun bawang","Garam dan lada"],"steps":[{"title":"Didihkan air dan bumbu","minutes":5,"body":"Didihkan air bersama bawang putih geprek."},{"title":"Masak sayur keras","minutes":8,"body":"Masukkan wortel, masak hingga empuk."},{"title":"Masukkan sayur hijau","minutes":4,"body":"Masukkan sawi atau buncis, beri garam dan lada."},{"title":"Sajikan","minutes":3,"body":"Taburi daun bawang dan sajikan hangat."}],"safety":"Rebus hingga mendidih merata. Simpan sisa sup di kulkas dan panaskan kembali sebelum dimakan."}'::jsonb, 20, null, 'Terbit'),
  ('bola-nasi-renyah', 'Resep', 'Bola nasi renyah', 'Kudapan', 'Nasi sisa dan wortel cincang jadi camilan renyah untuk anak.', '{"portions":"4 porsi","level":"Sedang","tool":"Wajan","uses":["nasi","wortel","telur"],"have":[{"name":"Nasi dingin","amount":"2 porsi"},{"name":"Wortel, cincang halus","amount":"½ buah"}],"extra":["3 sdm tepung terigu","1 butir telur (opsional)","Garam","Minyak untuk menggoreng"],"steps":[{"title":"Campur adonan","minutes":6,"body":"Campur nasi, wortel, tepung, garam, dan telur. Uleni hingga bisa dibentuk."},{"title":"Bentuk bola","minutes":7,"body":"Bentuk bola seukuran kelereng besar dengan tangan sedikit basah."},{"title":"Goreng","minutes":10,"body":"Goreng dengan api sedang hingga kuning keemasan. Tiriskan.","tip":"Api terlalu besar membuat luar gosong tapi tengah belum matang."},{"title":"Sajikan","minutes":2,"body":"Sajikan hangat. Cocok dengan saus tomat."}],"safety":"Pastikan bagian tengah matang merata. Perhatikan alergi telur dan gluten."}'::jsonb, 25, null, 'Terbit'),
  ('puding-roti', 'Resep', 'Puding roti panggang kayu manis', 'Olahan roti', 'Pinggiran roti tawar sisa menjadi hidangan penutup wangi.', '{"portions":"4 porsi","level":"Sedang","tool":"Oven","uses":["roti"],"have":[{"name":"Roti tawar atau pinggirannya","amount":"6 lembar"}],"extra":["400 ml susu","2 butir telur","3 sdm gula","½ sdt kayu manis"],"steps":[{"title":"Potong roti","minutes":5,"body":"Potong roti kotak-kotak, susun di loyang."},{"title":"Buat campuran susu","minutes":5,"body":"Kocok susu, telur, gula, dan kayu manis."},{"title":"Rendam","minutes":5,"body":"Tuang ke atas roti, diamkan hingga meresap."},{"title":"Panggang","minutes":20,"body":"Panggang 180°C sampai permukaan kecokelatan dan bagian tengah set."}],"safety":"Gunakan roti yang belum berjamur. Simpan sisa puding di kulkas maksimal 2 hari."}'::jsonb, 35, null, 'Terbit'),
  ('tumis-jamur', 'Resep', 'Tumis jamur tiram pedas manis', 'Tumisan', 'Sedang ditarik sementara untuk pembaruan takaran oleh tim kurasi.', '{"portions":"2 porsi","level":"Mudah","tool":"Wajan","uses":["jamur"],"have":[],"extra":[],"steps":[],"safety":""}'::jsonb, 15, null, 'Menunggu review')

on conflict (slug) do nothing;
update public.contents set reviewed_at = now() where status = 'Terbit' and reviewed_at is null;

-- 2. Challenge contoh (sama dengan katalog demo); periode mencakup masa pilot.
insert into public.challenges (title, description, period_start, period_end, roles, metric, target_count, status)
select * from (values
  ('Catat Pangan tiga hari', 'Catat persediaan atau surplus pada 3 hari berbeda.', date '2026-10-01', date '2026-12-31', array['pemberi', 'penerima'], 'catat_pangan', 3, 'Aktif'),
  ('Label donasi lengkap', 'Terbitkan 2 penawaran dengan informasi bahan atau alergen.', date '2026-10-01', date '2026-12-31', array['pemberi'], 'penawaran_alergen', 2, 'Aktif'),
  ('Lengkapi laporan distribusi', 'Isi laporan penggunaan untuk 3 penerimaan dalam 24 jam.', date '2026-10-01', date '2026-12-31', array['penerima'], 'laporan_distribusi_24j', 3, 'Aktif')
) as v (title, description, period_start, period_end, roles, metric, target_count, status)
where not exists (select 1 from public.challenges c where c.title = v.title);

-- 3. Paket reward contoh.
insert into public.reward_packs (title, detail, sponsor, quota, eligible_roles)
select * from (values
  ('Paket wadah besek higienis', '10 wadah besek bambu, kantong higienis pangan, dan label waktu masak.', 'Mitra Peduli Pangan', 20, array['pemberi', 'penerima']),
  ('Paket bahan pokok dapur komunitas', 'Beras lokal 5 kg dan minyak nabati untuk dapur pengolahan komunitas.', 'Sponsor Komunitas Bandung', 20, array['pemberi', 'penerima'])
) as v (title, detail, sponsor, quota, eligible_roles)
where not exists (select 1 from public.reward_packs r where r.title = v.title);

-- 4. Realtime: aplikasi memuat ulang data saat ada notifikasi baru. RLS notifications tetap berlaku untuk pelanggan.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
