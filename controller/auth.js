import mysql from 'mysql';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});


const regis = (req, res) => {
    const { id, nama, asal, edu, jurusan, bidang, mulai, selesai, no_wa, pw, cpw } = req.body;

    if (pw !== cpw) {
        return db.query("SELECT * FROM bidang", (err, results) => {
            if (err) console.error("Gagal mendapatkan data bidang:", err);
            return res.render("register", { bidang: results, error: "Password dan Konfirmasi Tidak Sama" });
        });
    }

    let pendidikan = edu === "sma" ? jurusan : `${edu} - ${jurusan}`;
    let fotoName = req.file ? req.file.filename : "profil.png";
    let status = "SEDANG MAGANG";
    let datetime = new Date().toISOString().slice(0, 19).replace("T", " ");

    db.query(
        "INSERT INTO magang (id, nama, nomor_wa, pword, asal, jurusan, mulai, selesai, status_magang, foto, id_bidang, create_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, nama, no_wa, pw, asal, pendidikan, mulai, selesai, status, fotoName, bidang, datetime],
        (error) => {
            if (error) {
                console.error("Gagal mendaftarkan anak magang:", error);
                return res.status(500).send("Gagal menyimpan data.");
            }

            const token = jwt.sign(
                { id, nama },
                process.env.SECRET_KEY,
                { expiresIn: "7d" } 
            );

            res.cookie("token", token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });

            return res.redirect(`/absen/rekap/${id}`);
        }
    );
};


const login = (req, res) => {
    const { id, pw, type } = req.body;

    db.query("SELECT * FROM magang WHERE id=?", [id], (err, result) => {
        if (err) {
            console.error("Gagal mendapatkan data pengguna:", err);
            return res.status(500).json({ message: "Terjadi kesalahan!" });
        }

        if (!result || result.length === 0) {
            return res.render("index", { error: "Akun tidak ditemukan" });
        }

        if (result[0].pword !== pw) {
            return res.render("index", { error: "Password atau ID magang salah" });
        }

        db.query("SELECT * FROM absen WHERE id=? ORDER BY tanggal DESC LIMIT 1", [id], (err, absenResult) => {
            if (err) {
                console.error("Gagal mendapatkan data absen:", err);
                return res.status(500).json({ message: "Terjadi kesalahan!" });
            }

            let isAbsenPulang = absenResult.length > 0 && absenResult[0].pulang !== null;

            const token = jwt.sign(
                { id: result[0].id, nama: result[0].nama, isAbsenPulang },
                process.env.SECRET_KEY,
                { expiresIn: '7d' } 
            );
            
            res.cookie("token", token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }); 
            
            if(type === 'rekap'){
                return res.redirect(`/absen/rekap/${id}`);
            } else {
                return res.render("phone", { id: id });
            } 
        });
    });
};


const logout = (req, res) => {
    const id = req.params.id;
    const currentDate = new Date();
    const today = currentDate.toISOString().split('T')[0];

    db.query('SELECT * FROM absen WHERE tanggal=? AND id=?', [today, id], (error, results) => {
        if (error) {
            console.error("Gagal mendapat data absen : ", error);
            return res.status(500).json({ message: "Terjadi kesalahan saat mengambil data absensi." });
        }

        if (results.length === 0) {
            return res.render('alert', { error: "Anda belum melakukan absensi hari ini!" });
        }

        const keluar = results[0].jam_keluar;

        if (keluar === null) {
            return res.render('alert', { error: "Anda hanya bisa logout jika sudah melakukan absensi pulang!" });
        } 
        
        res.clearCookie("token");
        return res.redirect('/index');
    });
};


const index = (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.render("index");
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.render("index"); 
        }

        const id = decoded.id;
        console.log("ID User adalah : ", id);
        return res.redirect(`/absen/rekap/${id}`);
    });
};

export default {
    regis, login, logout, index
}
