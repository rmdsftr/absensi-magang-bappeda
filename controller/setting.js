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

const jam = (req, res) => {
    const masuk = req.body.masuk;
    const keluar = req.body.keluar;

    db.query('UPDATE setting SET jam_masuk=?, jam_keluar=? WHERE id=1', [masuk,keluar],(error) => {
        if(error){
            console.error("Gagal memperbarui jam masuk dan jam keluar : ", error);
        }

        return res.redirect('/setting');
    })
}


const libur = (req, res) => {
    const awal = new Date(req.body.awal);
    const akhir = new Date(req.body.akhir);
    const desc = req.body.desc;

    if (!awal || !akhir || !desc) {
        return res.status(400).send('Data tidak boleh kosong');
    }

    let values = [];
    let currentDate = new Date(awal);
    
    while (currentDate <= akhir) {
        values.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    db.query('SELECT tanggal FROM libur WHERE tanggal IN (?)', [values], (err, existingDates) => {
        if (err) {
            console.error('Gagal mengecek tanggal libur:', err);
            return res.status(500).send('Gagal mengecek tanggal libur');
        }

        let existingSet = new Set(existingDates.map(row => row.tanggal));
        let newValues = values.filter(tgl => !existingSet.has(tgl)).map(tgl => [tgl, desc]);

        if (newValues.length === 0) {
            return res.status(400).send('Semua tanggal yang dipilih sudah ada dalam database');
        }

        db.query('INSERT INTO libur (tanggal, deskripsi) VALUES ?', [newValues], (err) => {
            if (err) {
                console.error('Gagal menambahkan hari libur:', err);
                return res.status(500).send('Gagal menambahkan hari libur');
            }
            res.redirect('/setting'); 
        });
    });
};

const del_ete = (req, res) => {
    const tanggal = req.params.tanggal;
    let tgl = new Date(tanggal);

    const year = tgl.getFullYear();
    const month = String(tgl.getMonth() + 1).padStart(2, '0');
    const day = String(tgl.getDate()).padStart(2, '0'); 

    const formattedDate = `${year}-${month}-${day}`;

    db.query('DELETE FROM libur WHERE tanggal=?', [formattedDate], (err) => {
        if(err){
            console.error("Gagal menghapus hari libur : ", err);
        }

        return res.redirect('/setting');
    })
}

const edit = (req, res) => {
    const tanggal = req.params.tanggal;

    let tgl = new Date(tanggal);

    const year = tgl.getFullYear();
    const month = String(tgl.getMonth() + 1).padStart(2, '0');
    const day = String(tgl.getDate()).padStart(2, '0'); 

    const formattedDate = `${year}-${month}-${day}`;
    
    db.query('SELECT * FROM setting WHERE id=1', (error, results) => {
        if(error){
            console.error("Gagal mendapatkan informasi setting");
        }

        const ip = results[0].ip;
        const masuk = results[0].jam_masuk;
        const keluar = results[0].jam_keluar;

        db.query('SELECT * FROM libur', (er, re) => {
            if(er){
                console.error("Gagal mendapat data libur : ", er);
            }

            db.query('SELECT * FROM libur WHERE tanggal=?', [formattedDate], (errEdit, resEdit) => {
                if(errEdit){
                    console.error("Gagal mendapat data libur untuk edit form : ", errEdit)
                }

                const edit = 1;

                return res.render('setting', {
                    ip: ip,
                    masuk : masuk,
                    keluar: keluar,
                    libur: re,
                    dataEdit: resEdit,
                    edit: edit
                })
            })
        })        
    })
}

const editLibur = (req, res) => {
    const tanggal = req.params.tanggal;
    const desc = req.body.desc;

    let tgl = new Date(tanggal);

    const year = tgl.getFullYear();
    const month = String(tgl.getMonth() + 1).padStart(2, '0');
    const day = String(tgl.getDate()).padStart(2, '0'); 

    const formattedDate = `${year}-${month}-${day}`;

    db.query('UPDATE libur SET deskripsi=? WHERE tanggal=?', [desc, formattedDate], (error) => {
        if(error){
            console.error("Gagal mengupdate deskripsi libur : ", error)
        }

        return res.redirect('/setting');
    })
}

const akun = (req, res) => {
    const id = req.params.id;

    db.query('SELECT * FROM magang WHERE id=?', [id], (err, re) => {
        if(err){
            console.error("Gagal mengambil data akun : ", err)
        }

        const foto = re[0].foto;
        const no_wa = re[0].nomor_wa;

        return res.render('editProfil', {
            foto: foto,
            no_wa: no_wa,
            id: id
        })
    })
}

const ubah = (req, res) => {
    const id = req.params.id;
    const pw = req.body.pw?.trim();
    const cpw = req.body.cpw?.trim();
    const no_wa = req.body.no_wa?.trim();
    const newFoto = req.file ? req.file.filename : null;

    console.log("Data yang diterima:", { id, pw, cpw, newFoto, no_wa });

    db.query("SELECT foto, pword, nomor_wa FROM magang WHERE id=?", [id], (err, result) => {
        if (err) {
            console.error("Gagal mengambil data pengguna:", err);
            return res.status(500).json({ message: "Terjadi kesalahan!" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan!" });
        }

        const oldFoto = result[0].foto;
        const oldPassword = result[0].pword;
        let updateFields = [];
        let updateValues = [];

        // Update foto kalau ada file baru
        if (newFoto) {
            updateFields.push("foto=?");
            updateValues.push(newFoto);
        }

        // Update password kalau disediakan
        if (pw && cpw) {
            if (pw === oldPassword) {
                updateFields.push("pword=?");
                updateValues.push(cpw);
            } else {
                console.error("Password lama tidak cocok!");
                return res.status(400).json({ message: "Password lama salah!" });
            }
        }

        // Tambahkan update nomor WhatsApp
        if (no_wa) {
            updateFields.push("nomor_wa=?");
            updateValues.push(no_wa);
        }

        // Kalau tidak ada perubahan sama sekali
        if (updateFields.length === 0) {
            console.log("Tidak ada perubahan yang dilakukan.");
            return res.redirect(`/absen/rekap/${id}`);
        }

        // Lanjutkan update ke database
        updateValues.push(id);
        const updateQuery = `UPDATE magang SET ${updateFields.join(", ")} WHERE id=?`;

        db.query(updateQuery, updateValues, (updateErr) => {
            if (updateErr) {
                console.error("Gagal mengupdate data:", updateErr);
                return res.status(500).json({ message: "Gagal mengupdate profil" });
            }

            console.log("Data berhasil diperbarui:", updateValues);

            // Hapus foto lama kalau ada upload foto baru
            if (newFoto && oldFoto) {
                const oldFotoPath = path.join(__dirname, "../uploads", oldFoto);
                fs.unlink(oldFotoPath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error("Gagal menghapus foto lama:", unlinkErr);
                    } else {
                        console.log("Foto lama berhasil dihapus:", oldFoto);
                    }
                });
            }

            return res.redirect(`/absen/rekap/${id}`);
        });
    });
};


const ip = (req, res) => {
    const ip = req.body.ip;

    db.query('UPDATE setting SET ip=? WHERE id=1', [ip], (err) =>{
        if(err){
            console.error("Gagal mengubah IP Address :", err);
        }

        return res.redirect('/setting');
    })
}


export default{
    jam, libur, del_ete, edit, editLibur, akun, ubah, ip
};