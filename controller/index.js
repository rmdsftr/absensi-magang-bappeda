import mysql from 'mysql';
import os from 'os';
import { execSync } from 'child_process';
import qrcode from 'qrcode';

const db = mysql.createConnection({
    host : process.env.DATABASE_HOST,
    user : process.env.DATABASE_USER,
    password : process.env.DATABASE_PASSWORD,
    database : process.env.DATABASE
});

const home = (req, res) => {
    const currentDate = new Date();
    const today = currentDate.toISOString().split('T')[0];

    function getLocalIP() {
        const networkInterfaces = os.networkInterfaces();
        for (let interfaceName in networkInterfaces) {
            for (let iface of networkInterfaces[interfaceName]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    if (interfaceName.toLowerCase().includes('wi-fi')) {
                        return iface.address;
                    }
                }
            }
        }
        return 'IP Tidak Ditemukan';  
    }

    function getConnectedWiFiName() {
        try {
            const output = execSync('netsh wlan show interfaces').toString();
            const ssidMatch = output.match(/^\s*SSID\s*:\s*(.+)$/m);
            return ssidMatch ? ssidMatch[1] : 'SSID Tidak Ditemukan';
        } catch (err) {
            console.error('Gagal mendapatkan SSID:', err);
            return 'SSID Tidak Ditemukan';
        }
    }    

    const ip = getLocalIP();
    const ssid = getConnectedWiFiName(); 

    db.query('SELECT ip FROM setting', (err, hasil) => {
        if (err) {
            console.error("Error saat mengambil IP dari database:", err);
            return;
        }

        if (hasil.length > 0 && hasil[0].ip !== null) {
            db.query('UPDATE setting SET ip=?, wifi=? WHERE id=1', [ip, ssid], (er, re) => {
                if (er) {
                    console.error("Gagal mengupdate IP dan Wi-Fi:", er);
                }
            });
        } else {
            db.query('INSERT INTO setting (id, ip, wifi) VALUES (1, ?, ?)', [ip, ssid], (eror, has) => {
                if (eror) {
                    console.error("Gagal menyimpan IP dan Wi-Fi:", eror);
                }
            });
        }
    });

    db.query('SELECT * FROM absen JOIN magang ON absen.id=magang.id WHERE tanggal=?', [today], (error, results) => {
        if(error){
            console.error('Gagal memuat data absen');
        }

        res.render('home', {
            absen: results,
            today: today,
            ssid: ssid
        })
    })
}


const all = (req, res) => {
    const filterTanggal = req.query.filterTanggal;
    let query = `
        SELECT DISTINCT DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal
        FROM absen
        ORDER BY tanggal ASC
    `;

    db.query(query, (error, tanggalResults) => {
        if (error) {
            console.error('Gagal mendapatkan daftar tanggal:', error);
            return res.status(500).send('Gagal mendapatkan data');
        }

        let absenQuery = `
            SELECT * FROM absen
            JOIN magang ON magang.id = absen.id
        `;

        const params = [];

        if (filterTanggal) {
            absenQuery += ' WHERE DATE(absen.tanggal) = ?';
            params.push(filterTanggal);
        } else {
            absenQuery += ' WHERE DATE(absen.tanggal) = CURDATE()'; // default: hari ini
        }

        db.query(absenQuery, params, (error, results) => {
            if (error) {
                console.error('Gagal mendapatkan data absen');
                return res.status(500).send('Gagal mendapatkan data');
            }

            db.query('SELECT ip, wifi FROM setting WHERE id=1', (er, hasil) => {
                if (er) {
                    console.error('Gagal mendapatkan IPv4:', er);
                    return res.status(500).send('Gagal mendapatkan data');
                }

                const wifi = hasil[0].wifi;
                const ip = hasil[0].ip;
                const link = `http://${ip}:3000/redirect`;

                qrcode.toDataURL(link, (err, url) => {
                    if (err) {
                        console.error('Gagal memuat QRCode');
                        return res.status(500).send('Gagal memuat QRCode');
                    }

                    res.render('absensi', {
                        data: results,
                        qrcode: url,
                        link: link,
                        wifi: wifi,
                        tanggalFilter: tanggalResults,
                        selectedDate: filterTanggal || new Date().toISOString().slice(0, 10) 
                    });
                });
            });
        });
    });
};

const regis = (req, res) => {
    db.query('SELECT * FROM bidang', (err, results) => {
        if(err){
            console.error("gagal mendapatkan data bidang : ", err)
        }

        return res.render('register', {
            bidang: results
        })
    })
}


const setting = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    db.query('SELECT * FROM setting WHERE id=1', (error, results) => {
        if (error) {
            console.error("Gagal mendapatkan informasi setting");
            return res.status(500).send("Server error");
        }

        const ip = results[0].ip;
        const wifi = results[0].wifi;
        const masuk = results[0].jam_masuk;
        const keluar = results[0].jam_keluar;

        db.query('SELECT COUNT(*) AS total FROM libur', (countErr, countResult) => {
            if (countErr) {
                console.error("Gagal menghitung total data libur");
                return res.status(500).send("Server error");
            }

            const totalData = countResult[0].total;
            const totalPages = Math.ceil(totalData / limit);

            db.query('SELECT * FROM libur ORDER BY tanggal ASC LIMIT ? OFFSET ?', [limit, offset], (er, re) => {
                if (er) {
                    console.error("Gagal mendapat data libur : ", er);
                    return res.status(500).send("Server error");
                }

                const pages = [];
                for (let i = 1; i <= totalPages; i++) {
                    pages.push({
                        page: i,
                        isCurrent: i === page
                    });
                }

                return res.render('setting', {
                    ip: ip,
                    wifi: wifi,
                    masuk: masuk,
                    keluar: keluar,
                    libur: re,
                    currentPage: page,
                    totalPages: totalPages,
                    hasPreviousPage: page > 1,
                    hasNextPage: page < totalPages,
                    previousPage: page - 1,
                    nextPage: page + 1,
                    pages: pages
                });
            });
        });
    });
};



const lupa = (req, res) => {
    return res.render('lupa');
}

const redirect = (req, res) => {
    const userAgent = req.headers["user-agent"];
    const isIphone = /iPhone|iPad|iPod/i.test(userAgent);

    db.query('SELECT ip FROM setting WHERE id=1', (err, results) => {
        const ip = results[0].ip;
        const targetUrl = `http://${ip}:3000/index`;

        if (isIphone) {
            return res.redirect(`/open-in-safari?redirect=${encodeURIComponent(targetUrl)}`);
        } else {
            return res.redirect(targetUrl);
        }
    })
}

const safari = (req, res) => {
    const redirectUrl = req.query.redirect 
    
    res.send(`
        <html>
        <head>
            <script>
                setTimeout(function() {
                    window.location.href = "${redirectUrl}";
                }, 1000);

                window.location.href = "${redirectUrl}", "_blank"; 
            </script>
        </head>
        <body>
            <p>Mengalihkan ke Safari...</p>
            <a href="${redirectUrl}">Klik di sini jika tidak otomatis terbuka.</a>
        </body>
        </html>
    `);
}

export default{
    home, all, regis, setting, lupa, redirect, safari
};