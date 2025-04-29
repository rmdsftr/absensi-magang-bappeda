import mysql from 'mysql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = mysql.createConnection({
    host : process.env.DATABASE_HOST,
    user : process.env.DATABASE_USER,
    password : process.env.DATABASE_PASSWORD,
    database : process.env.DATABASE
});

const magang = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    db.query('SELECT * FROM bidang', (err, results) => {
        if (err) {
            console.error("Gagal mengambil data bidang");
            return res.status(500).send("Server error");
        }

        db.query('SELECT COUNT(*) AS total FROM magang', (countErr, countResult) => {
            if (countErr) {
                console.error("Gagal menghitung total data magang");
                return res.status(500).send("Server error");
            }

            const totalData = countResult[0].total;
            const totalPages = Math.ceil(totalData / limit);

            db.query(
                `SELECT * FROM magang 
                 JOIN bidang ON magang.id_bidang = bidang.id_bidang 
                 LIMIT ? OFFSET ?`,
                [limit, offset],
                (error, hasil) => {
                    if (error) {
                        console.error("Gagal mengambil data magang");
                        return res.status(500).send("Server error");
                    }

                    const pages = [];
                    for (let i = 1; i <= totalPages; i++) {
                        pages.push({
                            page: i,
                            isCurrent: i === page
                        });
                    }

                    res.render('magang', {
                        bidang: results,
                        magang: hasil,
                        currentPage: page,
                        totalPages: totalPages,
                        hasPreviousPage: page > 1,
                        hasNextPage: page < totalPages,
                        previousPage: page - 1,
                        nextPage: page + 1,
                        pages: pages
                    });
                }
            );
        });
    });
};


const input = (req, res) =>{
    const id = req.body.id;
    const nama = req.body.nama;
    const asal = req.body.asal;
    const edu = req.body.edu;
    const jurusan = req.body.jurusan;

    let pendidikan = null;
    if(edu === 'sma'){
        pendidikan = jurusan;
    } else {
        pendidikan = edu + " - " + jurusan;
    }

    const id_bidang = req.body.bidang;
    const mulai = req.body.mulai;
    const selesai = req.body.selesai;
    const status = "SEDANG MAGANG";

    const now = new Date();
    const datetime = now.toISOString().slice(0, 19).replace("T", " ");

    const foto = 'profil.png';
    const pword = '12345678';

    db.query('INSERT INTO magang (id, nama, asal, jurusan, id_bidang, mulai, selesai, status_magang, create_at, foto, pword) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [id, nama, asal, pendidikan, id_bidang, mulai, selesai, status, datetime, foto, pword], (error, results) => {
        if(error){
            console.error("Gagal menginputkan data magang : ", error);
        }

        res.redirect('/magang');
    })
};

const profil = (req, res) => {
    const id = req.params.id;

    db.query('SELECT * FROM magang AS m JOIN bidang AS b ON m.id_bidang=b.id_bidang WHERE m.id=?', [id], (err, results) => {
        if (err) {
            console.error("Gagal menampilkan profil", err);
            return res.status(500).send("Gagal mendapatkan data magang");
        }

        if (results.length === 0) {
            console.log("Data magang tidak ditemukan untuk ID:", id);
            return res.status(404).send("Data magang tidak ditemukan");
        }

        console.log("Detail data magang sebelum update:", results);

        const bidang = results[0].nama_bidang;
        const id_bidang = results[0].id_bidang;

        // Konversi tanggal dari database ke format YYYY-MM-DD
        const mulai = new Date(results[0].mulai).toISOString().split('T')[0];
        const selesai = new Date(results[0].selesai).toISOString().split('T')[0];

        console.log("Mulai (dari database):", mulai);
        console.log("Selesai (dari database):", selesai);

        // Konversi tanggal menjadi hanya tanggal tanpa waktu
        const selesaiDate = new Date(results[0].selesai);
        const todayDate = new Date();

        const selesaiDateOnly = new Date(selesaiDate.getFullYear(), selesaiDate.getMonth(), selesaiDate.getDate());
        const todayDateOnly = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());

        console.log("Selesai (tanpa waktu):", selesaiDateOnly);
        console.log("Hari ini (tanpa waktu):", todayDateOnly);

        // Menentukan status berdasarkan perbandingan tanggal
        let status = selesaiDateOnly < todayDateOnly ? 'SELESAI MAGANG' : 'SEDANG MAGANG';

        console.log(`Status yang akan diperbarui: ${status}`);

        // Jalankan query UPDATE
        db.query('UPDATE magang SET status_magang=? WHERE id=?', [status, id], (errr, ress) => {
            if (errr) {
                console.error('Gagal memperbarui status magang:', errr);
                return res.status(500).send("Gagal memperbarui status magang");
            }

            console.log(`UPDATE berhasil: Status berubah menjadi '${status}'`);
            console.log('Jumlah baris yang terpengaruh:', ress.affectedRows);

            // Pastikan bahwa baris diperbarui
            if (ress.affectedRows === 0) {
                console.warn("WARNING: Tidak ada data yang diperbarui! Apakah ID benar?");
            }

            // Ambil kembali data terbaru setelah UPDATE
            db.query('SELECT * FROM magang AS m JOIN bidang AS b ON m.id_bidang=b.id_bidang WHERE m.id=?', [id], (err2, updatedResults) => {
                if (err2) {
                    console.error("Gagal mendapatkan data terbaru setelah update:", err2);
                    return res.status(500).send("Gagal mendapatkan data terbaru");
                }

                const startDate = new Date(updatedResults[0].mulai);
                const finishDate = new Date(updatedResults[0].selesai);

                const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
                const finish = `${finishDate.getFullYear()}-${String(finishDate.getMonth() + 1).padStart(2, '0')}-${String(finishDate.getDate()).padStart(2, '0')}`;



                console.log("Detail data magang setelah update:", updatedResults);

                db.query('SELECT * FROM absen WHERE id=?', [id], (error, hasil) => {
                    if (error) {
                        console.error('Gagal mendapatkan data absensi siswa/mahasiswa:', error);
                        return res.status(500).send("Gagal mendapatkan data absensi");
                    }

                    db.query('SELECT * FROM bidang', (er, re) => {
                        if (er) {
                            console.error("Gagal mendapatkan data bidang:", er);
                            return res.status(500).send("Gagal mendapatkan data bidang");
                        }

                        res.render('profil', {
                            data: updatedResults,
                            absen: hasil,
                            bidang: re,
                            id: id,
                            mulai: mulai,
                            selesai: selesai,
                            nama_bidang: bidang,
                            id_bidang: id_bidang,
                            status: status,
                            start : start,
                            finish: finish
                        });
                    });
                });
            });
        });
    });
};



const attend = (req, res) => {
    const id = req.params.id;

    res.render('phone', {
        id: id
    })
}

const confirm = (req, res) => {
    const id = req.body.id;
    const ket = req.body.ket;

    const currentDate = new Date();
    let hours = currentDate.getHours();
    let minutes = currentDate.getMinutes();
    let seconds = currentDate.getSeconds();

    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    const currentTime = `${hours}:${minutes}:${seconds}`;
    const today = currentDate.toISOString().split('T')[0]; // Mengambil tanggal dalam format YYYY-MM-DD

    // Ambil periode magang (mulai dan selesai) dari tabel magang
    db.query('SELECT mulai, selesai FROM magang WHERE id=?', [id], (err, result) => {
        if (err) {
            console.error("Gagal mengambil data periode magang:", err);
            return res.send("Terjadi kesalahan saat memeriksa periode magang.");
        }

        if (result.length === 0) {
            return res.status(404).send("Data magang tidak ditemukan.");
        }

        const mulai = result[0].mulai;
        const selesai = result[0].selesai;

        // Pastikan semua tanggal dalam format yang sama (string YYYY-MM-DD)
        const mulaiStr = new Date(mulai).toISOString().split('T')[0];
        const selesaiStr = new Date(selesai).toISOString().split('T')[0];

        // Debugging
        console.log("Today:", today);
        console.log("Mulai:", mulaiStr);
        console.log("Selesai:", selesaiStr);

        // Cek apakah tanggal hari ini berada dalam periode magang
        if (today < mulaiStr || today > selesaiStr) {
            const message = "Anda sedang tidak dalam periode magang di BAPPEDA Sumatera Barat";
            return res.render('alert', {
                done: message,
                id : id
            });
        }

        if (ket === "datang") {
            // Cek apakah sudah absen masuk hari ini
            db.query('SELECT * FROM absen WHERE tanggal=? AND id=? AND jam_masuk IS NOT NULL', [today, id], (errCheck, resCheck) => {
                if (errCheck) {
                    console.error("Gagal mengecek absen masuk:", errCheck);
                    return res.send("Terjadi kesalahan saat memeriksa absen.");
                }
                if (resCheck.length > 0) {
                    const done = "Anda sudah mengambil absen masuk hari ini";
                    return res.render('alert', {
                        done: done,
                        id : id
                    });
                }

                // Ambil jam masuk dari setting
                db.query('SELECT jam_masuk FROM setting WHERE id=1', (errr, resss) => {
                    if (errr) {
                        console.error("Gagal mendapatkan data jam masuk:", errr);
                        return res.send("Terjadi kesalahan saat mengambil data jam masuk.");
                    }

                    let deadline = resss[0].jam_masuk;
                    let status = (currentDate <= deadline) ? 'Tepat Waktu' : 'Terlambat';
                    const ket = 'Hadir';

                    // Insert absen masuk
                    db.query('INSERT INTO absen (tanggal, id, jam_masuk, status_masuk, keterangan) VALUES (?, ?, ?, ?, ?)', 
                    [today, id, currentTime, status, ket], (err) => {
                        if (err) {
                            console.error("Gagal memasukkan absen:", err);
                            return res.send("Gagal menyimpan absen masuk.");
                        }

                        return res.redirect(`/absen/rekap/${id}`);
                    });
                });
            });
        } else if (ket === "pulang") {
            db.query('SELECT * FROM absen WHERE tanggal=? AND id=?', [today, id], (er, result) => {
                if (er) {
                    console.error("Gagal memeriksa absen pagi:", er);
                    return res.send("Terjadi kesalahan saat memeriksa absen pagi.");
                }
                if (result.length === 0) {
                    const done = "Anda belum mengambil absen pagi";
                    return res.render('alert', {
                        done: done,
                        id : id
                    });
                }

                db.query('UPDATE absen SET jam_keluar=? WHERE tanggal=? AND id=?', [currentTime, today, id], (error) => {
                    if (error) {
                        console.error("Gagal memperbarui absen keluar:", error);
                        return res.send("Gagal memperbarui absen keluar.");
                    }
            
                    return res.redirect(`/absen/rekap/${id}`);
                });
            });
        }
    });
};



const edit = (req, res) => {
    const id = req.body.id;
    const bidang = req.body.bidang;
    const mulai = req.body.mulai;
    const selesai = req.body.selesai;

    const selesaiDate = new Date(selesai);
    const todayDate = new Date(); 

    let status = selesaiDate < todayDate ? 'SELESAI MAGANG' : 'SEDANG MAGANG';

    db.query('UPDATE magang SET status_magang=? WHERE id=?', [status, id], (errr, ress) => {
        if (errr) {
            console.error('Gagal memperbarui status magang:', errr);
        }

        db.query('UPDATE magang SET id_bidang=?, mulai=?, selesai=? WHERE id=?', [bidang, mulai, selesai, id], (error, result) => {
            if (error) {
                console.error('Profil gagal diperbarui:', error);
            }

            res.redirect(`/data/${id}`);
        });
    });
};


const hapus = (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).send('ID tidak boleh kosong');
    }

    db.query('SELECT foto FROM magang WHERE id = ?', [id], (err, rows) => {
        if (err) {
            console.error("Gagal mengambil data foto:", err);
            return res.status(500).send('Gagal mengambil data foto');
        }

        if (rows.length > 0) {
            const foto = rows[0].foto;

            if(foto === 'profil.png'){
                db.query('DELETE FROM absen WHERE id = ?', [id], (delErr) => {
                    if (delErr) {
                        console.error("Gagal menghapus data absen:", delErr);
                        return res.status(500).send('Gagal menghapus data absen');
                    }

                    db.query('DELETE FROM magang WHERE id = ?', [id], (delMagangErr) => {
                        if (delMagangErr) {
                            console.error("Gagal menghapus data magang:", delMagangErr);
                            return res.status(500).send('Gagal menghapus data magang');
                        }

                        res.redirect('/magang');
                    });
                });
            } else {
                const filePath = path.join(__dirname, '../uploads/', foto);

                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr && unlinkErr.code !== 'ENOENT') {
                        console.error("Gagal menghapus file:", unlinkErr);
                    }

                    db.query('DELETE FROM absen WHERE id = ?', [id], (delErr) => {
                        if (delErr) {
                            console.error("Gagal menghapus data absen:", delErr);
                            return res.status(500).send('Gagal menghapus data absen');
                        }

                        db.query('DELETE FROM magang WHERE id = ?', [id], (delMagangErr) => {
                            if (delMagangErr) {
                                console.error("Gagal menghapus data magang:", delMagangErr);
                                return res.status(500).send('Gagal menghapus data magang');
                            }

                            res.redirect('/magang');
                        });
                    });
                });
            }
        } else {
            return res.status(404).send('Data magang tidak ditemukan');
        }
    });
};

const editAbsen = (req, res) => {
    const id = req.params.id;
    const tanggal = req.params.tanggal;

    let tgl = new Date(tanggal);

    const year = tgl.getFullYear();
    const month = String(tgl.getMonth() + 1).padStart(2, '0');
    const day = String(tgl.getDate()).padStart(2, '0'); 

    const tanggalEdit = `${year}-${month}-${day}`;

    db.query('SELECT * FROM magang AS m JOIN bidang AS b ON m.id_bidang=b.id_bidang WHERE m.id=?', [id], (err, results) => {
        if (err) {
            console.error("Gagal menampilkan profil", err);
            return res.status(500).send("Gagal mendapatkan data magang");
        }

        if (results.length === 0) {
            console.log("Data magang tidak ditemukan untuk ID:", id);
            return res.status(404).send("Data magang tidak ditemukan");
        }

        console.log("Detail data magang sebelum update:", results);

        const bidang = results[0].nama_bidang;
        const id_bidang = results[0].id_bidang;

        // Konversi tanggal dari database ke format YYYY-MM-DD
        const mulai = new Date(results[0].mulai).toISOString().split('T')[0];
        const selesai = new Date(results[0].selesai).toISOString().split('T')[0];

        console.log("Mulai (dari database):", mulai);
        console.log("Selesai (dari database):", selesai);

        // Konversi tanggal menjadi hanya tanggal tanpa waktu
        const selesaiDate = new Date(results[0].selesai);
        const todayDate = new Date();

        const selesaiDateOnly = new Date(selesaiDate.getFullYear(), selesaiDate.getMonth(), selesaiDate.getDate());
        const todayDateOnly = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());

        console.log("Selesai (tanpa waktu):", selesaiDateOnly);
        console.log("Hari ini (tanpa waktu):", todayDateOnly);

        // Menentukan status berdasarkan perbandingan tanggal
        let status = selesaiDateOnly < todayDateOnly ? 'SELESAI MAGANG' : 'SEDANG MAGANG';

        console.log(`Status yang akan diperbarui: ${status}`);

        // Jalankan query UPDATE
        db.query('UPDATE magang SET status_magang=? WHERE id=?', [status, id], (errr, ress) => {
            if (errr) {
                console.error('Gagal memperbarui status magang:', errr);
                return res.status(500).send("Gagal memperbarui status magang");
            }

            console.log(`UPDATE berhasil: Status berubah menjadi '${status}'`);
            console.log('Jumlah baris yang terpengaruh:', ress.affectedRows);

            // Pastikan bahwa baris diperbarui
            if (ress.affectedRows === 0) {
                console.warn("WARNING: Tidak ada data yang diperbarui! Apakah ID benar?");
            }

            // Ambil kembali data terbaru setelah UPDATE
            db.query('SELECT * FROM magang AS m JOIN bidang AS b ON m.id_bidang=b.id_bidang WHERE m.id=?', [id], (err2, updatedResults) => {
                if (err2) {
                    console.error("Gagal mendapatkan data terbaru setelah update:", err2);
                    return res.status(500).send("Gagal mendapatkan data terbaru");
                }

                console.log("Detail data magang setelah update:", updatedResults);

                db.query('SELECT * FROM absen WHERE id=?', [id], (error, hasil) => {
                    if (error) {
                        console.error('Gagal mendapatkan data absensi siswa/mahasiswa:', error);
                        return res.status(500).send("Gagal mendapatkan data absensi");
                    }

                    db.query('SELECT * FROM bidang', (er, re) => {
                        if (er) {
                            console.error("Gagal mendapatkan data bidang:", er);
                            return res.status(500).send("Gagal mendapatkan data bidang");
                        }

                        db.query('SELECT * FROM absen WHERE id=? AND tanggal=?', [id, tanggalEdit], (erroEdit, hasilEdit) =>{
                            if(erroEdit){
                                console.error("Gagal mendapat data untuk mengisi form edit");
                            }

                            hasilEdit.forEach((row) => {
                                let tgl = new Date(row.tanggal);
                                let year = tgl.getFullYear();
                                let month = String(tgl.getMonth() + 1).padStart(2, '0'); // Tambah 1 karena getMonth() dimulai dari 0
                                let day = String(tgl.getDate()).padStart(2, '0');
                            
                                row.tanggal = `${year}-${month}-${day}`;
                            });

                            const edit = 1;

                            res.render('profil', {
                                data: updatedResults,
                                absen: hasil,
                                bidang: re,
                                id: id,
                                mulai: mulai,
                                selesai: selesai,
                                nama_bidang: bidang,
                                id_bidang: id_bidang,
                                status: status,
                                formEdit: hasilEdit,
                                edit: edit
                            });
                        })

                    });
                });
            });
        });
    });
};



export default {
    magang, input, profil, attend, confirm, edit, hapus, editAbsen
}