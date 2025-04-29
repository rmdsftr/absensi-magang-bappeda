
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
    