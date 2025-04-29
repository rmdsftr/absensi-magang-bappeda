
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
    
    
            function searchData() {
                let searchValue = document.getElementById('searchInput').value.toLowerCase();
                let rows = document.querySelectorAll(".tabel tbody tr");

                rows.forEach(row => {
                    let rowText = row.innerText.toLowerCase();
                    row.style.display = rowText.includes(searchValue) ? "" : "none";
                });
            }

            document.getElementById("searchInput").addEventListener("input", searchData);
        