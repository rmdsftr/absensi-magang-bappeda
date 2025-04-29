import mysql from 'mysql';
import qrcode from 'qrcode';

const db = mysql.createConnection({
    host : process.env.DATABASE_HOST,
    user : process.env.DATABASE_USER,
    password : process.env.DATABASE_PASSWORD,
    database : process.env.DATABASE
});

const filter = (req, res) => {
    const tanggal = req.params.selectedValue;

    if (!tanggal) {
        return res.status(400).send('Tanggal harus diberikan');
    }

    const dateParts = tanggal.split('-');
    if (dateParts.length !== 3) {
        return res.status(400).send('Format tanggal salah');
    }

    const formattedDate = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`;

    db.query('SELECT * FROM absen JOIN magang ON magang.id=absen.id WHERE tanggal=?', [formattedDate], (error, results) => {
        if (error) {
            console.error("Gagal menfilter tanggal:", error);
            return res.status(500).send('Gagal mendapatkan data');
        }

        db.query(`
            SELECT DISTINCT DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal
            FROM absen
            ORDER BY tanggal ASC
        `, (error, tanggalResults) => {
            if (error) {
                console.error('Gagal mendapatkan daftar tanggal:', error);
                return res.status(500).send('Gagal mendapatkan data');
            }


            db.query('SELECT ip FROM setting WHERE id=1', (er, hasil) => {
                if (er) {
                    console.error('Gagal mendapatkan IPv4:', er);
                    return res.status(500).send('Gagal mendapatkan data');
                }

                const ip = hasil[0].ip;
                const link = `http://${ip}:3000/index`;

                qrcode.toDataURL(link, (err, url) => {
                    if (err) {
                        console.error('Gagal memuat QRCode');
                        return res.status(500).send('Gagal memuat QRCode');
                    }

                    res.render('absensi', {
                        data: results,
                        qrcode: url,
                        link: link,
                        tanggalFilter: tanggalResults
                    });
                });
            });
        });
    });
};

export default {
    filter
};