document.addEventListener('DOMContentLoaded', function () {
    // Batasi input nomor telepon hanya ke angka
    const editPhone = document.getElementById('editPhone');
    if (editPhone) {
        editPhone.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '');
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

    // Toggle visibilitas kata sandi
    function togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const icon = document.getElementById(`toggle${inputId.charAt(0).toUpperCase() + inputId.slice(1)}`);
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    // Event listener untuk tombol Request OTP (Edit Profil)
    const requestOtp = document.getElementById('requestOtp');
    if (requestOtp) {
        requestOtp.addEventListener('click', function () {
            requestOtp.disabled = true;
            document.getElementById('editLoadingSpinner').style.display = 'flex';

            const phone = document.getElementById('editPhone').value;
            const email = document.getElementById('editEmail').value;

            if (!phone) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Nomor telepon tidak boleh kosong.'
                });
                requestOtp.disabled = false;
                document.getElementById('editLoadingSpinner').style.display = 'none';
                return;
            }

            const phoneRegex = /^(0|\+62)\d{9,12}$/;
            if (!phoneRegex.test(phone)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Nomor telepon tidak valid. Harus dimulai dengan 0 atau +62 dan memiliki 10-13 digit.'
                });
                requestOtp.disabled = false;
                document.getElementById('editLoadingSpinner').style.display = 'none';
                return;
            }

            const formData = new FormData();
            formData.append('phone', phone.replace(/[^0-9]/g, ''));
            formData.append('email', email);

            fetch('/api/request_otp', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            })
                .then(response => response.json())
                .then(data => {
                    if (data.result === 'success') {
                        Swal.fire({
                            icon: 'success',
                            title: 'Berhasil',
                            text: 'Kode OTP telah dikirim ke WhatsApp Anda.'
                        });
                        document.getElementById('otpField').style.display = 'block';
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
                        text: 'Terjadi kesalahan saat meminta kode OTP.'
                    });
                })
                .finally(() => {
                    requestOtp.disabled = false;
                    document.getElementById('editLoadingSpinner').style.display = 'none';
                });
        });
    } else {
        console.error('requestOtp button not found.');
    }

    // Event listener untuk tombol Save Changes (Edit Profil)
    const saveChanges = document.getElementById('saveChanges');
    if (saveChanges) {
        saveChanges.addEventListener('click', function () {
            saveChanges.disabled = true;
            document.getElementById('editLoadingSpinner').style.display = 'flex';

            const simFile = document.getElementById('editSimImage').files[0];
            const profileFile = document.getElementById('editProfileImage').files[0];
            const phone = document.getElementById('editPhone').value;
            const email = document.getElementById('editEmail').value;
            const otpCode = document.getElementById('editOtpCode')?.value;

            if (simFile && !simFile.type.startsWith('image/')) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'File SIM harus berupa gambar (jpg, png, dll).'
                });
                saveChanges.disabled = false;
                document.getElementById('editLoadingSpinner').style.display = 'none';
                return;
            }

            if (profileFile && !profileFile.type.startsWith('image/')) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'File profil harus berupa gambar (jpg, png, dll).'
                });
                saveChanges.disabled = false;
                document.getElementById('editLoadingSpinner').style.display = 'none';
                return;
            }

            if (!phone) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Nomor telepon tidak boleh kosong.'
                });
                saveChanges.disabled = false;
                document.getElementById('editLoadingSpinner').style.display = 'none';
                return;
            }

            const phoneRegex = /^(0|\+62)\d{9,12}$/;
            if (!phoneRegex.test(phone)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Nomor telepon tidak valid. Harus dimulai dengan 0 atau +62 dan memiliki 10-13 digit.'
                });
                saveChanges.disabled = false;
                document.getElementById('editLoadingSpinner').style.display = 'none';
                return;
            }

            let cleanedPhone = phone.replace(/[^0-9]/g, '');
            if (cleanedPhone.startsWith('0')) {
                cleanedPhone = cleanedPhone;
            } else if (cleanedPhone.startsWith('62')) {
                cleanedPhone = '0' + cleanedPhone.slice(2);
            }

            const formData = new FormData();
            formData.append('username', document.getElementById('editName').value);
            formData.append('email', email);
            formData.append('phone', cleanedPhone);
            formData.append('address', document.getElementById('editAddress').value);
            formData.append('name', document.getElementById('editFullName').value);
            if (profileFile) formData.append('profile_image', profileFile);
            if (simFile) formData.append('image', simFile);
            if (otpCode) formData.append('otp_code', otpCode);

            fetch('/profile', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.result === 'success') {
                        document.getElementById('email').innerText = email;
                        document.getElementById('phone').innerText = cleanedPhone;
                        document.getElementById('address').innerText = document.getElementById('editAddress').value;
                        document.getElementById('name').innerText = document.getElementById('editFullName').value;

                        if (simFile) {
                            const reader = new FileReader();
                            reader.onload = function (e) {
                                document.getElementById('ktpSimImage').src = e.target.result;
                            };
                            reader.readAsDataURL(simFile);
                        }

                        if (profileFile) {
                            const reader = new FileReader();
                            reader.onload = function (e) {
                                document.getElementById('profileImage').src = e.target.result;
                            };
                            reader.readAsDataURL(profileFile);
                        }

                        $('#editModal').modal('hide');
                        Swal.fire({
                            icon: 'success',
                            title: 'Berhasil',
                            text: 'Profil berhasil diperbarui!'
                        });
                        document.getElementById('otpField').style.display = 'none';
                        document.getElementById('requestOtp').style.display = 'none';
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
                        text: 'Terjadi kesalahan saat memperbarui profil.'
                    });
                })
                .finally(() => {
                    saveChanges.disabled = false;
                    document.getElementById('editLoadingSpinner').style.display = 'none';
                });
        });
    } else {
        console.error('saveChanges button not found.');
    }

    // Event listener untuk tombol Request OTP (Ganti Kata Sandi)
    const requestPasswordOtp = document.getElementById('requestPasswordOtp');
    if (requestPasswordOtp) {
        requestPasswordOtp.addEventListener('click', function () {
            requestPasswordOtp.disabled = true;
            document.getElementById('passwordLoadingSpinner').style.display = 'flex';

            fetch('/api/request_otp', {
                method: 'POST',
                credentials: 'include'
            })
                .then(response => response.json())
                .then(data => {
                    if (data.result === 'success') {
                        Swal.fire({
                            icon: 'success',
                            title: 'Berhasil',
                            text: 'Kode OTP telah dikirim ke WhatsApp Anda.'
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
                        text: 'Terjadi kesalahan saat meminta kode OTP.'
                    });
                })
                .finally(() => {
                    requestPasswordOtp.disabled = false;
                    document.getElementById('passwordLoadingSpinner').style.display = 'none';
                });
        });
    } else {
        console.error('requestPasswordOtp button not found.');
    }

    // Event listener untuk tombol Change Password
    const changePassword = document.getElementById('changePassword');
    if (changePassword) {
        changePassword.addEventListener('click', function () {
            changePassword.disabled = true;
            document.getElementById('passwordLoadingSpinner').style.display = 'flex';

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;
            const otpCode = document.getElementById('passwordOtpCode').value;

            if (!currentPassword || !newPassword || !confirmNewPassword || !otpCode) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Semua field harus diisi.'
                });
                changePassword.disabled = false;
                document.getElementById('passwordLoadingSpinner').style.display = 'none';
                return;
            }

            if (newPassword.length < 8) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Kata sandi baru harus minimal 8 karakter.'
                });
                changePassword.disabled = false;
                document.getElementById('passwordLoadingSpinner').style.display = 'none';
                return;
            }

            if (newPassword !== confirmNewPassword) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Kata sandi baru dan konfirmasi tidak cocok.'
                });
                changePassword.disabled = false;
                document.getElementById('passwordLoadingSpinner').style.display = 'none';
                return;
            }

            const formData = new FormData();
            formData.append('current_password', currentPassword);
            formData.append('new_password', newPassword);
            formData.append('otp_code', otpCode);

            fetch('/api/change_password', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.result === 'success') {
                        $('#changePasswordModal').modal('hide');
                        Swal.fire({
                            icon: 'success',
                            title: 'Berhasil',
                            text: 'Kata sandi berhasil diperbarui!'
                        });
                        document.getElementById('changePasswordForm').reset();
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
                        text: 'Terjadi kesalahan saat mengganti kata sandi.'
                    });
                })
                .finally(() => {
                    changePassword.disabled = false;
                    document.getElementById('passwordLoadingSpinner').style.display = 'none';
                });
        });
    } else {
        console.error('changePassword button not found.');
    }

    // Periksa perubahan nomor telepon atau email untuk menampilkan tombol OTP
    const originalPhone = document.getElementById('editPhone').value;
    const originalEmail = document.getElementById('editEmail').value;
    document.getElementById('editPhone').addEventListener('input', checkChanges);
    document.getElementById('editEmail').addEventListener('input', checkChanges);

    function checkChanges() {
        const currentPhone = document.getElementById('editPhone').value;
        const currentEmail = document.getElementById('editEmail').value;
        if (currentPhone !== originalPhone || currentEmail !== originalEmail) {
            document.getElementById('requestOtp').style.display = 'block';
        } else {
            document.getElementById('requestOtp').style.display = 'none';
            document.getElementById('otpField').style.display = 'none';
        }
    }
});

// Fungsi untuk menampilkan foto SIM
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

// Fungsi untuk toggle visibilitas kata sandi
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(`toggle${inputId.charAt(0).toUpperCase() + inputId.slice(1)}`);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}