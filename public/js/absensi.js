
            let tanggalElements = document.querySelectorAll('.tanggal');

            tanggalElements.forEach(function(element) {
                let tanggal = element.innerText;  

                let date = new Date(tanggal);  

                let options = { day: '2-digit', month: 'long', year: 'numeric' };
                let tanggalFormatted = date.toLocaleDateString('id-ID', options); 

                element.innerText = tanggalFormatted;  
            });
        
        
            function showQR(){
                var qr = document.getElementById('qr');
                if (qr) {
                    qr.style.display = 'flex';
                } else {
                    console.error('Form not found');
                }
            }
            function closeQR() {
                var qr = document.getElementById('qr');
                if (qr) {
                    qr.style.display = 'none';
                } else {
                    console.error('Form not found');
                }
            }
        
        
            function searchData() {
                let searchValue = document.getElementById('searchInput').value.toLowerCase();
                let rows = document.querySelectorAll(".tabel tbody tr");

                rows.forEach(row => {
                    let rowText = row.innerText.toLowerCase();
                    row.style.display = rowText.includes(searchValue) ? "" : "none";
                });
            }

            document.getElementById("searchInput").addEventListener("input", searchData);
        
        
            document.getElementById("filterBulan").addEventListener("change", function () {
                const selectedValue = this.value;
                if (selectedValue) {
                    window.location.href = `/filter/${selectedValue}`;
                }
            });

        function filterTanggal() {
            const tanggal = document.getElementById('filterTanggal').value;
            if (tanggal) {
                window.location.href = `/absen/all?filterTanggal=${tanggal}`;
            }
        }

        function copyText() {
            var copyTextarea = document.getElementById("myTextarea");

            copyTextarea.select();
            copyTextarea.setSelectionRange(0, 99999); 

            navigator.clipboard.writeText(copyTextarea.value)
                .then(() => {
                alert('Teks berhasil disalin!');
                })
                .catch(err => {
                console.error('Gagal menyalin: ', err);
                });
        }
        
        