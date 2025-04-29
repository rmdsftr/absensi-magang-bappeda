import mysql from 'mysql';
import ExcelJS from 'exceljs';
import moment from 'moment-timezone';

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

const user = async (req, res) => {
    const id = req.params.id;

    db.query(
        'SELECT * FROM magang JOIN bidang ON bidang.id_bidang = magang.id_bidang WHERE id = ?',
        [id],
        (err, hasil) => {
            if (err || hasil.length === 0) {
                console.error('Gagal mendapatkan data anak magang:', err);
                return res.status(500).send('Gagal mendapatkan data');
            }

            const { nama, asal, jurusan, mulai, selesai, nama_bidang } = hasil[0];

            const mulaiFormatted = moment(mulai).tz('Asia/Jakarta').format('DD-MM-YYYY');
            const selesaiFormatted = moment(selesai).tz('Asia/Jakarta').format('DD-MM-YYYY');

            db.query(
                'SELECT tanggal, jam_masuk, status_masuk, jam_keluar, keterangan FROM absen WHERE id = ?',
                [id],
                async (error, results) => {
                    if (error) {
                        console.error('Gagal mendapatkan data absensi:', error);
                        return res.status(500).send('Gagal mendapatkan data absensi');
                    }

                    db.query('SELECT tanggal FROM libur', async (er, liburRes) => {
                        if (er) {
                            console.error('Gagal mendapatkan tanggal libur:', er);
                            return res.status(500).send('Gagal mendapatkan data libur');
                        }

                        // Konversi tanggal libur menjadi format YYYY-MM-DD untuk perbandingan konsisten
                        const tanggalLibur = liburRes.map(row => moment(row.tanggal).format('YYYY-MM-DD'));
                        
                        // Menghitung semua hari kerja dalam periode magang (kecuali Sabtu, Minggu, dan tanggal libur)
                        let tanggalMagang = [];
                        let currentDate = moment(mulai).tz('Asia/Jakarta').startOf('day');
                        let endDate = moment(selesai).tz('Asia/Jakarta').endOf('day');

                        while (currentDate.isSameOrBefore(endDate, 'day')) {
                            let tglString = currentDate.format('YYYY-MM-DD');
                            // Hanya masukkan hari kerja (bukan Sabtu/Minggu) dan bukan tanggal libur
                            const dayOfWeek = currentDate.day(); // 0 = Minggu, 6 = Sabtu
                            if (![0, 6].includes(dayOfWeek) && !tanggalLibur.includes(tglString)) {
                                tanggalMagang.push(tglString);
                            }
                            currentDate.add(1, 'day');
                        }

                        // Pastikan format tanggal konsisten untuk data absensi
                        const absenFormatted = results.map(item => ({
                            ...item,
                            tanggal: moment(item.tanggal).format('YYYY-MM-DD')
                        }));

                        // Filter absensi hanya untuk hari kerja (bukan hari libur)
                        let absenValid = absenFormatted.filter(row => !tanggalLibur.includes(row.tanggal));
                        let absenTanggal = absenValid.map(a => a.tanggal);

                        // Hitung statistik kehadiran
                        let hadir = absenValid.filter(a => a.keterangan === 'Hadir').length;
                        let sakit = absenValid.filter(a => a.keterangan === 'Sakit').length;
                        let izin = absenValid.filter(a => a.keterangan === 'Izin').length;
                        
                        // Alpha adalah hari kerja minus hari dengan absensi
                        let alpha = tanggalMagang.filter(tgl => !absenTanggal.includes(tgl)).length;

                        // Mulai membuat file Excel
                        const workbook = new ExcelJS.Workbook();
                        const worksheet = workbook.addWorksheet('Laporan Absensi');

                        // Judul Laporan
                        const titleCell = worksheet.getCell('A1');
                        titleCell.value = 'LAPORAN ABSENSI PESERTA MAGANG';
                        titleCell.font = { bold: true, size: 16 };
                        worksheet.mergeCells('A1:E1');
                        titleCell.alignment = { horizontal: 'center' };

                        // Format identitas peserta
                        const identitas = [
                            ['Nama', ': ' + nama],
                            ['Asal Instansi', ': ' + asal],
                            ['Jurusan', ': ' + jurusan],
                            ['Tanggal Magang', ': ' + `${mulaiFormatted} s/d ${selesaiFormatted}`],
                            ['Bidang Penempatan', ': ' + nama_bidang]
                        ];

                        identitas.forEach((row, index) => {
                            const cellA = worksheet.getCell(`A${index + 3}`);
                            const cellB = worksheet.getCell(`B${index + 3}`);
                            cellA.value = row[0];
                            cellB.value = row[1];

                            cellA.font = { bold: true };
                            // Gabungkan sel B-E untuk nilai data
                            worksheet.mergeCells(`B${index + 3}:E${index + 3}`);
                        });

                        // Header tabel absensi
                        const headerRow = worksheet.getRow(9);
                        headerRow.values = ['No', 'Tanggal', 'Jam Masuk', 'Status Masuk', 'Jam Keluar', 'Keterangan'];
                        headerRow.font = { bold: true };
                        headerRow.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFF99' } // Warna kuning untuk header
                        };
                        
                        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

                        // Border untuk header
                        headerRow.eachCell(cell => {
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                        });

                        // Isi tabel absensi
                        let rowIndex = 10;
                        tanggalMagang.forEach((tgl, index) => {
                            const absen = absenValid.find(a => a.tanggal === tgl);
                            
                            // Format tanggal untuk tampilan
                            const formattedDate = moment(tgl).format('DD-MM-YYYY');
                            
                            let rowValues = [index + 1, formattedDate, '', '', '', 'Alpha'];
                            
                            if (absen) {
                                rowValues = [
                                    index + 1,
                                    formattedDate,
                                    absen.jam_masuk || '',
                                    absen.status_masuk || '',
                                    absen.jam_keluar || '',
                                    absen.keterangan || 'Alpha'
                                ];
                            }
                            
                            const row = worksheet.getRow(rowIndex);
                            row.values = rowValues;

                            // Center align untuk kolom nomor dan tanggal
                            row.getCell(1).alignment = { horizontal: 'center' };
                            row.getCell(2).alignment = { horizontal: 'center' };
                            
                            // Tambahkan border untuk setiap sel di tabel
                            row.eachCell(cell => {
                                cell.border = {
                                    top: { style: 'thin' },
                                    left: { style: 'thin' },
                                    bottom: { style: 'thin' },
                                    right: { style: 'thin' }
                                };
                            });

                            rowIndex++;
                        });

                        // Statistik kehadiran
                        const summaryStartRow = rowIndex + 2;
                        
                        // Tambahkan header untuk bagian statistik
                        worksheet.getCell(`A${summaryStartRow - 1}`).value = 'REKAPITULASI KEHADIRAN';
                        worksheet.getCell(`A${summaryStartRow - 1}`).font = { bold: true };
                        worksheet.mergeCells(`A${summaryStartRow - 1}:E${summaryStartRow - 1}`);
                        
                        const summary = [
                            ['Hadir', hadir],
                            ['Sakit', sakit],
                            ['Izin', izin],
                            ['Alpha', alpha],
                            ['Total Hari Kerja', tanggalMagang.length]
                        ];

                        summary.forEach((row, index) => {
                            const labelCell = worksheet.getCell(`A${summaryStartRow + index}`);
                            const valueCell = worksheet.getCell(`B${summaryStartRow + index}`);
                            
                            labelCell.value = row[0];
                            valueCell.value = row[1];

                            labelCell.font = { bold: true };
                            
                            // Tambahkan border untuk statistik
                            [labelCell, valueCell].forEach(cell => {
                                cell.border = {
                                    top: { style: 'thin' },
                                    left: { style: 'thin' },
                                    bottom: { style: 'thin' },
                                    right: { style: 'thin' }
                                };
                            });
                        });

                        // Tanda tangan
                        const signatureRow = summaryStartRow + summary.length + 3;
                        worksheet.getCell(`D${signatureRow}`).value = 'Padang, ' + moment().format('DD MMMM YYYY');
                        worksheet.mergeCells(`D${signatureRow}:F${signatureRow}`);
                        worksheet.getCell(`D${signatureRow}`).alignment = { horizontal: 'center' };
                        
                        worksheet.getCell(`D${signatureRow + 1}`).value = 'Mengetahui,';
                        worksheet.mergeCells(`D${signatureRow + 1}:F${signatureRow + 1}`);
                        worksheet.getCell(`D${signatureRow + 1}`).alignment = { horizontal: 'center' };
                        
                        worksheet.getCell(`D${signatureRow + 2}`).value = 'Kepala Bidang ' + nama_bidang;
                        worksheet.mergeCells(`D${signatureRow + 2}:F${signatureRow + 2}`);
                        worksheet.getCell(`D${signatureRow + 2}`).alignment = { horizontal: 'center' };
                        
                        worksheet.getCell(`D${signatureRow + 6}`).value = '______________________';
                        worksheet.mergeCells(`D${signatureRow + 6}:F${signatureRow + 6}`);
                        worksheet.getCell(`D${signatureRow + 6}`).alignment = { horizontal: 'center' };
                        
                        worksheet.getCell(`D${signatureRow + 7}`).value = 'NIP. ________________';
                        worksheet.mergeCells(`D${signatureRow + 7}:F${signatureRow + 7}`);
                        worksheet.getCell(`D${signatureRow + 7}`).alignment = { horizontal: 'center' };

                        // Auto-size kolom
                        worksheet.columns.forEach((column, index) => {
                            if (index === 0) { // Kolom No
                                column.width = 5;
                            } else if (index === 1) { // Kolom Tanggal
                                column.width = 15;
                            } else {
                                column.width = 18;
                            }
                        });

                        // Set response header untuk download file
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader('Content-Disposition', `attachment; filename=rekap_absen_${nama.replace(/\s+/g, '_')}.xlsx`);

                        await workbook.xlsx.write(res);
                        res.end();
                    });
                }
            );
        }
    );
};


const absen = (req, res) => {
    try {
        const filterTanggal = req.query.filterTanggal || moment().format('YYYY-MM-DD');
        const formattedDate = moment(filterTanggal).format('DD MMMM YYYY');

        console.log("Generating Excel report for date:", filterTanggal);
        
        // Query untuk mengambil data absensi dari database
        const query = `
            SELECT absen.id, magang.nama, magang.jurusan, magang.asal, bidang.nama_bidang as penempatan, 
            absen.jam_masuk as datang, absen.status_masuk, absen.jam_keluar as pulang, absen.keterangan 
            FROM absen 
            JOIN magang ON magang.id=absen.id 
            JOIN bidang ON magang.id_bidang=bidang.id_bidang 
            WHERE absen.tanggal=?
        `;
        
        db.query(query, [filterTanggal], async (error, results) => {
            if (error) {
                console.error("Gagal mendapat data absen: ", error);
                return res.status(500).send("Terjadi kesalahan saat mengambil data absensi");
            }
            
            // Cek apakah ada data yang ditemukan
            if (!results || results.length === 0) {
                console.log("Tidak ada data absensi ditemukan untuk tanggal:", filterTanggal);
                return res.status(404).send(`Tidak ada data absensi ditemukan untuk tanggal ${formattedDate}`);
            }
            
            console.log(`Ditemukan ${results.length} data absensi untuk tanggal ${filterTanggal}`);

            try {
                // Buat workbook dan worksheet baru
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Laporan Absensi');
                
                // Tambahkan judul laporan di baris ke-2
                worksheet.mergeCells('A2:I2');
                const titleCell = worksheet.getCell('A2');
                titleCell.value = `REPORT ABSENSI ${formattedDate}`;
                titleCell.font = { bold: true, size: 16 };
                titleCell.alignment = { horizontal: 'center' };
                
                // PERBAIKAN 1: Hapus definisi kolom dengan header otomatis
                // Dan tambahkan header secara manual di baris ke-4 sesuai spesifikasi
                worksheet.getCell('A4').value = 'ID';
                worksheet.getCell('B4').value = 'Nama';
                worksheet.getCell('C4').value = 'Jurusan';
                worksheet.getCell('D4').value = 'Asal';
                worksheet.getCell('E4').value = 'Penempatan';
                worksheet.getCell('F4').value = 'Datang';
                worksheet.getCell('G4').value = 'Status';
                worksheet.getCell('H4').value = 'Pulang';
                worksheet.getCell('I4').value = 'Keterangan';
                
                // Set lebar kolom agar sesuai dengan konten
                worksheet.columns = [
                    { key: 'id', width: 10 },
                    { key: 'nama', width: 25 },
                    { key: 'jurusan', width: 20 },
                    { key: 'asal', width: 20 },
                    { key: 'penempatan', width: 20 },
                    { key: 'datang', width: 15 },
                    { key: 'status_masuk', width: 10 },
                    { key: 'pulang', width: 15 },
                    { key: 'keterangan', width: 15 }
                ];
                
                // Set font bold pada header kolom tabel
                const headerRow = worksheet.getRow(4);
                headerRow.eachCell((cell) => {
                    cell.font = { bold: true };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD3D3D3' } // Light gray background
                    };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                });
                
                // Menambahkan data ke worksheet
                let rowIndex = 5; // Data dimulai dari baris ke-5 (setelah header)
                
                // PERBAIKAN 2: Inisialisasi counter kehadiran dengan 0
                let hadir = 0, sakit = 0, izin = 0, alpha = 0;
                
                results.forEach(record => {
                    const row = worksheet.getRow(rowIndex);
                    
                    row.getCell(1).value = record.id;
                    row.getCell(2).value = record.nama;
                    row.getCell(3).value = record.jurusan;
                    row.getCell(4).value = record.asal;
                    row.getCell(5).value = record.penempatan;
                    row.getCell(6).value = record.datang ? moment(record.datang, 'HH:mm:ss').format('HH:mm') : '-';
                    row.getCell(7).value = record.status_masuk;
                    row.getCell(8).value = record.pulang ? moment(record.pulang, 'HH:mm:ss').format('HH:mm') : '-';
                    row.getCell(9).value = record.keterangan;
                    
                    // PERBAIKAN 2: Perbaikan pada penghitungan statistik
                    if (record.keterangan) {
                        const keterangan = record.keterangan.toLowerCase();
                        if (keterangan === 'hadir') hadir++;
                        else if (keterangan === 'sakit') sakit++;
                        else if (keterangan === 'izin') izin++;
                        else if (keterangan === 'alpha') alpha++;
                    }
                    
                    // Tambahkan border untuk setiap sel
                    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        if (colNumber <= 9) {
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                        }
                    });
                    
                    rowIndex++;
                });
                
                // Tambahkan ringkasan di bawah tabel
                const summaryRow = rowIndex + 2; // Beri jarak 1 baris dari tabel
                worksheet.mergeCells(`A${summaryRow}:C${summaryRow}`);
                worksheet.getCell(`A${summaryRow}`).value = 'RINGKASAN KEHADIRAN:';
                worksheet.getCell(`A${summaryRow}`).font = { bold: true, size: 12 };
                
                // Tambahkan border dan format untuk statistik kehadiran
                const statRows = [
                    { label: 'Hadir', value: hadir },
                    { label: 'Sakit', value: sakit },
                    { label: 'Izin', value: izin },
                    { label: 'Alpha', value: alpha },
                    { label: 'Total', value: hadir + sakit + izin + alpha }
                ];
                
                statRows.forEach((stat, idx) => {
                    const currentRow = summaryRow + idx + 1;
                    
                    // Membuat sel label
                    worksheet.getCell(`A${currentRow}`).value = `${stat.label}:`;
                    worksheet.getCell(`A${currentRow}`).font = { bold: true };
                    
                    // Membuat sel value
                    worksheet.getCell(`B${currentRow}`).value = `${stat.value} orang`;
                    
                    // Jika ini adalah total (baris terakhir), tambahkan highlight khusus
                    if (idx === statRows.length - 1) {
                        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
                        worksheet.getCell(`B${currentRow}`).font = { bold: true };
                    }
                });
                
                // Set nama file berdasarkan tanggal
                const fileName = `Laporan_Absensi_${filterTanggal}.xlsx`;
                
                // Set header respons untuk download file
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
                
                // Kirim file ke klien
                await workbook.xlsx.write(res);
                res.end();
                
            } catch (err) {
                console.error("Error saat generate laporan absensi:", err);
                res.status(500).send("Terjadi kesalahan saat generate laporan");
            }
        });
    } catch (outerError) {
        console.error("Error di luar proses query:", outerError);
        res.status(500).send("Terjadi kesalahan sistem");
    }
};

export default {
    user, absen
};