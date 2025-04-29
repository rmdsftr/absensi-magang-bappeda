
        function closeEdit(){
            window.history.back();
        }
    

    
        function showForm() {
            var form = document.getElementById('form');
            if (form) {
                form.style.display = 'flex';
            } else {
                console.error('Form not found');
            }
        }

        function closeForm() {
            var form = document.getElementById('form');
            if (form) {
                form.style.display = 'none';
            } else {
                console.error('Form not found');
            }
        }
    
    
        document.querySelectorAll('.date').forEach(function(td) {
            const date = new Date(td.textContent);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            td.textContent = date.toLocaleDateString('id-ID', options);
        });
    

    
        let tanggalElements = document.querySelectorAll('.tanggal');

        tanggalElements.forEach(function(element) {
            let tanggal = element.innerText;  

            let date = new Date(tanggal);  

            let options = { day: '2-digit', month: 'long', year: 'numeric' };
            let tanggalFormatted = date.toLocaleDateString('id-ID', options); 

            element.innerText = tanggalFormatted;  
        });
    

    
        const statusSelect = document.getElementById('status');
        const hadirDiv = document.querySelector('.hadir');

        statusSelect.addEventListener('change', function() {
            if (this.value === 'Hadir') {
                hadirDiv.style.display = 'flex'; 
            } else {
                hadirDiv.style.display = 'none';  
            }
        });
    
    
        function showTambah() {
            var form = document.getElementById('tambah');
            if (form) {
                form.style.display = 'flex';
            } else {
                console.error('Form not found');
            }
        }

        function closeTambah() {
            var form = document.getElementById('tambah');
            if (form) {
                form.style.display = 'none';
            } else {
                console.error('Form not found');
            }
        }
    

    
        document.addEventListener("DOMContentLoaded", function () {
            const statusSelect = document.getElementById('statusEdit');
            const hadirDiv = document.querySelector('.hadirEdit');

            if (statusSelect.value === 'Hadir') {
                hadirDiv.style.display = 'flex';
            }

            statusSelect.addEventListener('change', function () {
                if (this.value === 'Hadir') {
                    hadirDiv.style.display = 'flex'; 
                } else {
                    hadirDiv.style.display = 'none';  
                }
            });
        });
    