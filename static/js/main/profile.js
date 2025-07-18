document.addEventListener('DOMContentLoaded', function () {
    // Batasi input nomor telepon hanya ke angka
    const editPhone = document.getElementById('editPhone');
    if (editPhone) {
        editPhone.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, ''); // Hanya izinkan angka
            checkAvailability('phone', this.value);
        });
    } else {
        console.error('editPhone input not found.');
    }

    // Pratinjau gambar profil baru
    const editProfileImage = document.getElementById('editProfileImage');
    const profileImagePreview = document.getElementById('profileImagePreview');
    if (editProfileImage && profileImagePreview) {
        editProfileImage.addEventListener('change', function () {
            const file = this.files[0];
            profileImagePreview.style.display = 'none';
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    profileImagePreview.src = e.target.result;
                    profileImagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'File profil harus berupa gambar (jpg, png, dll).'
                });
            }
        });
    } else {
        console.error('editProfileImage or profileImagePreview not found.');
    }

    // Pratinjau gambar SIM baru
    const editSimImage = document.getElementById('editSimImage');
    const simImagePreview = document.getElementById('simImagePreview');
    if (editSimImage && simImagePreview) {
        editSimImage.addEventListener('change', function () {
            const file = this.files[0];
            simImagePreview.style.display = 'none';
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    simImagePreview.src = e.target.result;
                    simImagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'File SIM harus berupa gambar (jpg, png, dll).'
                });
            }
        });
    } else {
        console.error('editSimImage or simImagePreview not found.');
    }

    // Pemeriksaan real-time untuk username, email, dan nomor telepon
    const editName = document.getElementById('editName');
    const editEmail = document.getElementById('editEmail');
    if (editName) {
        editName.addEventListener('input', function () {
            checkAvailability('username', this.value);
        });
    }
    if (editEmail) {
        editEmail.addEventListener('input', function () {
            checkAvailability('email', this.value);
        });
    }

    // Fungsi untuk memeriksa ketersediaan
    function checkAvailability(field, value) {
        if (!value) {
            document.getElementById(`${field}Availability`).innerText = '';
            return;
        }
        fetch('/api/check_availability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ field, value }),
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                const availabilityDiv = document.getElementById(`${field}Availability`);
                if (data.available) {
                    availabilityDiv.innerText = `${field.charAt(0).toUpperCase() + field.slice(1)} tersedia`;
                    availabilityDiv.className = 'availability-message available';
                } else {
                    availabilityDiv.innerText = `${field.charAt(0).toUpperCase() + field.slice(1)} sudah digunakan`;
                    availabilityDiv.className = 'availability-message unavailable';
                }
            })
            .catch(error => {
                console.error(`Error checking ${field} availability:`, error);
                document.getElementById(`${field}Availability`).innerText = 'Gagal memeriksa ketersediaan';
                document.getElementById(`${field}Availability`).className = 'availability-message unavailable';
            });
    }

    // Tombol tampilkan/sembunyikan password
    window.togglePassword = function (inputId, element) {
        const input = document.getElementById(inputId);
        const icon = element.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    };

    // Kelola fokus saat modal ditutup
    const editModal = document.getElementById('editModal');
    const editProfileButton = document.getElementById('editProfileButton');
    if (editModal && editProfileButton) {
        editModal.addEventListener('hidden.bs.modal', function () {
            editProfileButton.focus(); // Kembalikan fokus ke tombol Edit
        });
    }

    // Event listener untuk tombol Save Changes
    const saveChanges = document.getElementById('saveChanges');
    if (saveChanges) {
        saveChanges.addEventListener('click', function () {
            saveChanges.disabled = true;
            document.getElementById('loadingSpinner').style.display = 'flex';

            // Validasi file SIM
            const simFile = document.getElementById('editSimImage').files[0];
            if (simFile && !simFile.type.startsWith('image/')) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'File SIM harus berupa gambar (jpg, png, dll).'
                });
                saveChanges.disabled = false;
                document.getElementById('loadingSpinner').style.display = 'none';
                return;
            }

            // Validasi file profil
            const profileFile = document.getElementById('editProfileImage').files[0];
            if (profileFile && !profileFile.type.startsWith('image/')) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'File profil harus berupa gambar (jpg, png, dll).'
                });
                saveChanges.disabled = false;
                document.getElementById('loadingSpinner').style.display = 'none';
                return;
            }

            // Validasi nomor telepon
            const phone = document.getElementById('editPhone').value;
            if (!phone) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Nomor telepon tidak boleh kosong.'
                });
                saveChanges.disabled = false;
                document.getElementById('loadingSpinner').style.display = 'none';
                return;
            }

            // Validasi format nomor telepon
            const phoneRegex = /^(0|\+62)\d{9,12}$/;
            if (!phoneRegex.test(phone)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Nomor telepon tidak valid. Harus dimulai dengan 0 atau +62 dan memiliki 10-13 digit.'
                });
                saveChanges.disabled = false;
                document.getElementById('loadingSpinner').style.display = 'none';
                return;
            }

            // Validasi username
            const username = document.getElementById('editName').value;
            if (!username) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Nama pengguna tidak boleh kosong.'
                });
                saveChanges.disabled = false;
                document.getElementById('loadingSpinner').style.display = 'none';
                return;
            }
            if (username.length < 8) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Nama pengguna minimal 8 karakter.'
                });
                saveChanges.disabled = false;
                document.getElementById('loadingSpinner').style.display = 'none';
                return;
            }
            if (!username[0].match(/[a-zA-Z]/)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Nama pengguna harus diawali dengan huruf.'
                });
                saveChanges.disabled = false;
                document.getElementById('loadingSpinner').style.display = 'none';
                return;
            }
            if (!username.match(/^[a-zA-Z0-9._]+$/)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Nama pengguna hanya boleh berisi huruf, angka, titik, atau garis bawah.'
                });
                saveChanges.disabled = false;
                document.getElementById('loadingSpinner').style.display = 'none';
                return;
            }

            // Validasi email
            const email = document.getElementById('editEmail').value;
            if (!email) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Email tidak boleh kosong.'
                });
                saveChanges.disabled = false;
                document.getElementById('loadingSpinner').style.display = 'none';
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Format email tidak valid.'
                });
                saveChanges.disabled = false;
                document.getElementById('loadingSpinner').style.display = 'none';
                return;
            }

            // Validasi nama lengkap
            const name = document.getElementById('editFullName').value;
            if (!name) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Nama lengkap tidak boleh kosong.'
                });
                saveChanges.disabled = false;
                document.getElementById('loadingSpinner').style.display = 'none';
                return;
            }

            // Validasi password jika diisi
            const oldPassword = document.getElementById('oldPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            if (oldPassword || newPassword) {
                if (!oldPassword || !newPassword) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Password lama dan baru harus diisi.'
                    });
                    saveChanges.disabled = false;
                    document.getElementById('loadingSpinner').style.display = 'none';
                    return;
                }
                if (newPassword.length < 8) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Password baru minimal 8 karakter.'
                    });
                    saveChanges.disabled = false;
                    document.getElementById('loadingSpinner').style.display = 'none';
                    return;
                }
            }

            // Sanitasi nomor telepon
            let cleanedPhone = phone.replace(/[^0-9]/g, '');
            if (cleanedPhone.startsWith('0')) {
                cleanedPhone = cleanedPhone;
            } else if (cleanedPhone.startsWith('62')) {
                cleanedPhone = '0' + cleanedPhone.slice(2);
            }

            // Mengumpulkan data dari form
            const formData = new FormData();
            formData.append('username', username);
            formData.append('email', email);
            formData.append('phone', cleanedPhone);
            formData.append('address', document.getElementById('editAddress').value);
            formData.append('name', name);
            if (profileFile) formData.append('profile_image', profileFile);
            if (simFile) formData.append('image', simFile);
            if (oldPassword) formData.append('old_password', oldPassword);
            if (newPassword) formData.append('new_password', newPassword);

            // Mengirimkan permintaan ke server
            fetch('/profile', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(data => {
                            throw new Error(data.msg || 'Network response was not ok');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.result === 'success') {
                        // Memperbarui UI dengan data baru
                        document.getElementById('email').innerText = email;
                        document.getElementById('phone').innerText = cleanedPhone;
                        document.getElementById('address').innerText = document.getElementById('editAddress').value;
                        document.getElementById('name').innerText = name;

                        // Memperbarui gambar SIM jika ada file baru
                        if (simFile) {
                            const reader = new FileReader();
                            reader.onload = function (e) {
                                document.getElementById('ktpSimImage').src = e.target.result;
                            };
                            reader.readAsDataURL(simFile);
                        }

                        // Memperbarui gambar profil jika ada file baru
                        if (profileFile) {
                            const reader = new FileReader();
                            reader.onload = function (e) {
                                document.getElementById('profileImage').src = e.target.result;
                            };
                            reader.readAsDataURL(profileFile);
                        }

                        // Menutup modal dan menampilkan pesan sukses
                        $('#editModal').modal('hide');
                        Swal.fire({
                            icon: 'success',
                            title: 'Berhasil',
                            text: 'Profil berhasil diperbarui!'
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: data.msg
                        });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: error.message || 'Terjadi kesalahan saat memperbarui profil. Silakan coba lagi nanti.'
                    });
                })
                .finally(() => {
                    document.getElementById('loadingSpinner').style.display = 'none';
                    saveChanges.disabled = false;
                });
        });
    } else {
        console.error('saveChanges button not found.');
    }
});

function showImage() {
    const simImage = document.getElementById('ktpSimImage');
    if (simImage && simImage.src) {
        Swal.fire({
            title: 'Foto SIM',
            imageUrl: simImage.src,
            imageAlt: 'Foto SIM',
            imageWidth: '100%',
            imageHeight: 'auto',
            showCloseButton: true,
            showConfirmButton: false
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Foto SIM tidak ditemukan!'
        });
    }
}