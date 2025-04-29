
        function showJam() {
            var form = document.getElementById('formJam');
            if (form) {
                form.style.display = 'flex';
            } else {
                console.error('Form not found');
            }
        }

        function closeJam() {
            var form = document.getElementById('formJam');
            if (form) {
                form.style.display = 'none';
            } else {
                console.error('Form not found');
            }
        }
    
    
        function showLibur() {
            var form = document.getElementById('formLibur');
            if (form) {
                form.style.display = 'flex';
            } else {
                console.error('Form not found');
            }
        }

        function closeLibur() {
            var form = document.getElementById('formLibur');
            if (form) {
                form.style.display = 'none';
            } else {
                console.error('Form not found');
            }
        }
    
    
            let tanggalElements = document.querySelectorAll('.tgl');

            tanggalElements.forEach(function(element) {
                let tanggal = element.innerText;  

                let date = new Date(tanggal);  

                let options = { day: '2-digit', month: 'long', year: 'numeric' };
                let tanggalFormatted = date.toLocaleDateString('id-ID', options); 

                element.innerText = tanggalFormatted;  
            });
        

        
            function closeEdit(){
                window.history.back();
            }
        
            function togglePassword() {
                const input = document.getElementById('password');
                input.type = input.type === 'password' ? 'text' : 'password';
                resizeInput(input);
                }
        
                function resizeInput(input) {
                    input.style.width = (input.value.length + 1) + 'ch';
                }
        
                window.onload = () => {
                    const input = document.getElementById('password');
                    resizeInput(input);
                };

                function showIP() {
                    var form = document.getElementById('formIP');
                    if (form) {
                        form.style.display = 'flex';
                    } else {
                        console.error('Form not found');
                    }
                }
        
                function closeIP() {
                    var form = document.getElementById('formIP');
                    if (form) {
                        form.style.display = 'none';
                    } else {
                        console.error('Form not found');
                    }
                }
        
                function showEmail() {
                    var form = document.getElementById('formEmail');
                    if (form) {
                        form.style.display = 'flex';
                    } else {
                        console.error('Form not found');
                    }
                }
        
                function closeEmail() {
                    var form = document.getElementById('formEmail');
                    if (form) {
                        form.style.display = 'none';
                    } else {
                        console.error('Form not found');
                    }
                }