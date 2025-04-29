import mysql from 'mysql';

const db = mysql.createConnection({
    host : process.env.DATABASE_HOST,
    user : process.env.DATABASE_USER,
    password : process.env.DATABASE_PASSWORD,
    database : process.env.DATABASE
});

const add = (req, res) => {
    const id = req.body.id;
    const tgl = req.body.tgl;
    const ket = req.body.ket;
    const masuk = req.body.masuk; 
    const keluar = req.body.keluar;

    if(ket === 'Hadir'){

        db.query('SELECT jam_masuk FROM setting WHERE id=1', (er, re) => {
            if(er){
                console.error("error : ", er);
            }

            let deadline = re[0].jam_masuk;
            let status = null;
            if (masuk <= deadline) {
                status = 'Tepat Waktu';
            } else {
                status = 'Terlambat';
            }

            db.query('INSERT INTO absen (tanggal, id, jam_masuk, status_masuk, jam_keluar, keterangan) VALUES (?,?,?,?,?,?)', [tgl, id, masuk, status, keluar, ket], (error, results) => {
                if(error){
                    console.error('error : ', error)
                }
    
                console.log("data masuk : ", results);
    
                return res.redirect(`/data/${id}`);
            })
        })
        
    } else {
        db.query('INSERT INTO absen (tanggal, id, status_masuk, keterangan) VALUES (?,?,?,?)', [tgl, id, '-', ket], (error, results) => {
            if(error){
                console.error('error : ', error)
            }

            console.log("data masuk : ", results);

            return res.redirect(`/data/${id}`);
        })
    }
}

const del_ete = (req, res) => {
    const id = req.params.id;
    const tanggal = req.params.tanggal;

    console.log("tanggal : ", tanggal);

    let tgl = new Date(tanggal);

    const year = tgl.getFullYear();
    const month = String(tgl.getMonth() + 1).padStart(2, '0');
    const day = String(tgl.getDate()).padStart(2, '0'); 

    const formattedDate = `${year}-${month}-${day}`;

    console.log("tanggal sekarang : ", formattedDate);

    db.query('DELETE FROM absen WHERE id=? AND tanggal=?', [id, formattedDate], (error) => {
        if(error){
            console.error("gagal menghapus absen : ", error);
        }

        return res.redirect('/absen/all');
    })
}

const hapus = (req, res) => {
    const id = req.params.id;
    const tanggal = req.params.today;

    console.log("tanggal : ", tanggal);

    let tgl = new Date(tanggal);

    const year = tgl.getFullYear();
    const month = String(tgl.getMonth() + 1).padStart(2, '0'); 
    const day = String(tgl.getDate()).padStart(2, '0'); 

    const formattedDate = `${year}-${month}-${day}`;

    console.log("tanggal sekarang : ", formattedDate);

    db.query('DELETE FROM absen WHERE id=? AND tanggal=?', [id, formattedDate], (error) => {
        if(error){
            console.error("gagal menghapus absen : ", error);
        }

        return res.redirect('/');
    })
}

const del = (req, res) => {
    const id = req.params.id;
    const tanggal = req.params.tanggal;

    console.log("tanggal : ", tanggal);

    let tgl = new Date(tanggal);

    const year = tgl.getFullYear();
    const month = String(tgl.getMonth() + 1).padStart(2, '0'); 
    const day = String(tgl.getDate()).padStart(2, '0'); 

    const formattedDate = `${year}-${month}-${day}`;

    console.log("tanggal sekarang : ", formattedDate);

    db.query('DELETE FROM absen WHERE id=? AND tanggal=?', [id, formattedDate], (error) => {
        if(error){
            console.error("gagal menghapus absen : ", error);
        }

        return res.redirect(`/data/${id}`);
    })
}

const edit = (req, res) => {
    const id = req.params.id;
    const tanggal = req.params.tanggal;
    const jamMasukUser = req.body.masuk;
    const jamKeluarUser = req.body.keluar;

    let tgl = new Date(tanggal);
    const formattedDate = tgl.toISOString().split('T')[0]; 

    db.query('SELECT jam_masuk FROM setting LIMIT 1', (err, hasil) => {
        if (err) {
            console.error("Gagal mengambil data setting jam: ", err);
            return res.status(500).send("Terjadi kesalahan saat mengambil data setting.");
        }

        if (hasil.length === 0) {
            return res.status(404).send("Data setting tidak ditemukan.");
        }

        const jamMasukSetting = hasil[0].jam_masuk;

        let status_masuk = (jamMasukUser <= jamMasukSetting) ? 'Tepat Waktu' : 'Terlambat';

        db.query('UPDATE absen SET jam_masuk=?, jam_keluar=?, status_masuk=? WHERE id=? AND tanggal=?',
            [jamMasukUser, jamKeluarUser, status_masuk, id, formattedDate],
            (error) => {
                if (error) {
                    console.error("Gagal mengupdate absen: ", error);
                    return res.status(500).send("Terjadi kesalahan saat mengupdate data absen.");
                }

                return res.redirect('/absen');
            }
        );
    });
};

const editAbsen = (req, res) => {
    const id = req.params.id;
    const tanggal = req.body.tgl;

    let tgl = new Date(tanggal);

    const year = tgl.getFullYear();
    const month = String(tgl.getMonth() + 1).padStart(2, '0'); 
    const day = String(tgl.getDate()).padStart(2, '0'); 

    const formattedDate = `${year}-${month}-${day}`;

    let masuk = null;
    let keluar = null;
    let status = null;

    let ket = req.body.ket;
    if(ket === "Hadir"){
        masuk = req.body.masuk;
        keluar = req.body.keluar;

        db.query('SELECT jam_masuk FROM setting WHERE id=1', (err, has) => {
            if(err){
                console.error("Gagal mendapatkan data jam masuk dari setting :", err);
            }

            const deadline = has[0].jam_masuk;
            if (masuk <= deadline) {
                status = 'Tepat Waktu';
            } else {
                status = 'Terlambat';
            }

            db.query('UPDATE absen SET jam_masuk=?, status_masuk=?, jam_keluar=?, keterangan=? WHERE tanggal=? AND id=?', [masuk, status, keluar, ket, formattedDate, id], (error) => {
                if(error){
                    console.error("Gagal mengupdate absen magang : ", error);
                }
        
                return res.redirect(`/data/${id}`);
            })
        })
    } else {
        status = '-';

        db.query('UPDATE absen SET jam_masuk=?, status_masuk=?, jam_keluar=?, keterangan=? WHERE tanggal=? AND id=?', [masuk, status, keluar, ket, formattedDate, id], (error) => {
            if(error){
                console.error("Gagal mengupdate absen magang : ", error);
            }
    
            return res.redirect(`/data/${id}`);
        })
    }
}

const rekap = (req, res) => {
    const id = req.params.id;

    db.query('SELECT * FROM magang LEFT JOIN absen on magang.id=absen.id LEFT JOIN bidang ON magang.id_bidang=bidang.id_bidang WHERE magang.id=?', [id], (er, re) => {
        if(er){
            console.error('Gagal mengambil rekap : ', er)
        }

        const nama = re[0].nama;
        const asal = re[0].asal;
        const jurusan = re[0].jurusan;
        const mulai = re[0].mulai;
        const selesai = re[0].selesai;
        const foto = re[0].foto;
        const bidang = re[0].nama_bidang;

        return res.render('rekap', {
            data: re,
            id: id,
            nama: nama,
            asal: asal,
            jurusan: jurusan,
            mulai: mulai,
            selesai: selesai,
            foto: foto,
            bidang: bidang
        })
    })
}

export default {
    add, del_ete, hapus, del, edit, editAbsen, rekap
};