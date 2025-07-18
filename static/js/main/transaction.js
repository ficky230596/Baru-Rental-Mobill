// Fungsi untuk memulai penghitung waktu mundur
function startTimer(createdAt, orderId) {
    // Pastikan createdAt diuraikan dengan benar dengan zona waktu
    const createdTime = new Date(createdAt);
    const expiryTime = new Date(createdTime.getTime() + 10 * 60 * 1000); // 10 menit dari created_at
    const timerElement = document.querySelector(`#timer-${orderId} .timer`);
    const timerModalElement = document.querySelector(`.timer-modal[data-order-id="${orderId}"] .timer`);

    function updateTimer() {
        const now = new Date();
        const timeLeft = expiryTime - now;

        if (timeLeft <= 0) {
            timerElement.textContent = "Kedaluwarsa";
            if (timerModalElement) timerModalElement.textContent = "Kedaluwarsa";
            clearInterval(timerInterval);
            checkTransactionStatus(orderId); // Periksa status segera
            return;
        }

        const minutes = Math.floor(timeLeft / 1000 / 60);
        const seconds = Math.floor((timeLeft / 1000) % 60);
        const timeString = `${minutes}m ${seconds}s (WITA)`; // Tambahkan label WITA
        timerElement.textContent = timeString;
        if (timerModalElement) timerModalElement.textContent = timeString;
    }

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
}

// Fungsi untuk memeriksa status transaksi
function checkTransactionStatus(orderId) {
    fetch(`/api/check_transaction_status/${orderId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.result === 'success') {
            const row = document.getElementById(orderId);
            const timerElement = document.querySelector(`#timer-${orderId} .timer`);
            const statusElement = document.querySelector(`.status-value[data-order-id="${orderId}"]`);
            const pesanElement = document.querySelector(`.pesan-value[data-order-id="${orderId}"]`);
            const modalFooter = document.querySelector(`#modal-${orderId} .modal-footer`);

            if (data.status === 'canceled') {
                timerElement.textContent = '-';
                statusElement.textContent = 'Dibatalkan'; // Tampilkan teks yang ramah pengguna
                if (data.pesan && !pesanElement) {
                    // Tambahkan elemen Alasan jika belum ada
                    const ul = statusElement.closest('ul');
                    const li = document.createElement('li');
                    li.className = 'd-flex align-items-center mb-3';
                    li.innerHTML = `<span class="label">Alasan</span><span class="value pesan-value" data-order-id="${orderId}">${data.pesan}</span>`;
                    ul.appendChild(li);
                } else if (pesanElement) {
                    pesanElement.textContent = data.pesan;
                }
                if (modalFooter) {
                    modalFooter.remove(); // Hapus tombol Bayar dan Batalkan
                }
                row.className = 'transaksi-canceled';
                document.getElementById('payment-alert').innerHTML = `Transaksi ${orderId} telah dibatalkan: ${data.pesan || 'Alasan tidak tersedia'}`;
                document.getElementById('payment-alert').classList.remove('d-none');
                setTimeout(() => {
                    document.getElementById('payment-alert').classList.add('d-none');
                }, 5000);
            }
        }
    })
    .catch(error => {
        console.error('Error checking transaction status:', error);
    });
}

// Fungsi untuk membatalkan transaksi secara manual
function cancelPayment(orderId) {
    if (confirm('Apakah Anda yakin ingin membatalkan transaksi ini?')) {
        const cancelButton = document.querySelector(`.cancel-button[data-order-id="${orderId}"]`);
        const loadingIcon = cancelButton.querySelector('.loading-icon');
        const buttonText = cancelButton.querySelector('span');

        loadingIcon.classList.remove('d-none');
        buttonText.textContent = 'Membatalkan...';

        fetch('/api/cancelPayment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `order_id=${orderId}`,
        })
        .then(response => response.json())
        .then(data => {
            loadingIcon.classList.add('d-none');
            buttonText.textContent = 'Batalkan';
            if (data.result === 'success') {
                const row = document.getElementById(orderId);
                const timerElement = document.querySelector(`#timer-${orderId} .timer`);
                const statusElement = document.querySelector(`.status-value[data-order-id="${orderId}"]`);
                const modalFooter = document.querySelector(`#modal-${orderId} .modal-footer`);
                const pesanElement = document.querySelector(`.pesan-value[data-order-id="${orderId}"]`);

                timerElement.textContent = '-';
                statusElement.textContent = 'Dibatalkan'; // Tampilkan teks yang ramah pengguna
                if (data.pesan && !pesanElement) {
                    const ul = statusElement.closest('ul');
                    const li = document.createElement('li');
                    li.className = 'd-flex align-items-center mb-3';
                    li.innerHTML = `<span class="label">Alasan</span><span class="value pesan-value" data-order-id="${orderId}">${data.pesan || 'Dibatalkan sendiri'}</span>`;
                    ul.appendChild(li);
                } else if (pesanElement) {
                    pesanElement.textContent = data.pesan || 'Dibatalkan sendiri';
                }
                if (modalFooter) {
                    modalFooter.remove();
                }
                row.className = 'transaksi-canceled';
                document.getElementById('payment-alert').innerHTML = 'Transaksi berhasil dibatalkan';
                document.getElementById('payment-alert').classList.remove('d-none');
                setTimeout(() => {
                    document.getElementById('payment-alert').classList.add('d-none');
                }, 5000);
            } else {
                document.getElementById('payment-alert').innerHTML = `Gagal membatalkan transaksi: ${data.message}`;
                document.getElementById('payment-alert').classList.remove('d-none');
                setTimeout(() => {
                    document.getElementById('payment-alert').classList.add('d-none');
                }, 5000);
            }
        })
        .catch(error => {
            loadingIcon.classList.add('d-none');
            buttonText.textContent = 'Batalkan';
            console.error('Error cancelling payment:', error);
            document.getElementById('payment-alert').innerHTML = 'Terjadi kesalahan saat membatalkan transaksi';
            document.getElementById('payment-alert').classList.remove('d-none');
            setTimeout(() => {
                document.getElementById('payment-alert').classList.add('d-none');
            }, 5000);
        });
    }
}

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Mulai penghitung untuk setiap transaksi unpaid
    document.querySelectorAll('.timer').forEach(timer => {
        const orderId = timer.getAttribute('data-order-id');
        const row = document.getElementById(orderId);
        const createdAt = row.getAttribute('data-created-at');
        if (createdAt) {
            startTimer(createdAt, orderId);
        }
    });

    // Tambahkan event listener untuk tombol batalkan
    document.querySelectorAll('.cancel-button').forEach(button => {
        button.addEventListener('click', () => {
            const orderId = button.getAttribute('data-order-id');
            cancelPayment(orderId);
        });
    });

    // Periksa status transaksi setiap 10 detik
    setInterval(() => {
        document.querySelectorAll('.timer').forEach(timer => {
            const orderId = timer.getAttribute('data-order-id');
            checkTransactionStatus(orderId);
        });
    }, 10000);
});