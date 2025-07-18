import jwt
import requests
import base64
import os
from dbconnection import db
from datetime import datetime
import logging
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import pytz

# Konfigurasi logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Zona waktu WITA
WITA_TZ = pytz.timezone('Asia/Makassar')

def createSecretMessage(msg: str, secret_key: str, redirect: str = "/") -> str:
    payload = {"message": msg, "redirect": redirect}
    msg = jwt.encode(payload, secret_key, algorithm="HS256")
    return msg

def canceltransaction(order_id: str, msg: str) -> bool:
    try:
        # Cari transaksi berdasarkan order_id
        transaction = db.transaction.find_one({"order_id": order_id})
        if not transaction:
            logger.error(f"Transaksi tidak ditemukan untuk order_id: {order_id}")
            raise ValueError("Transaksi tidak ditemukan")

        # Validasi status transaksi (hanya batalkan jika statusnya 'unpaid')
        if transaction["status"] != "unpaid":
            logger.error(
                f"Transaksi {order_id} tidak dapat dibatalkan karena status bukan 'unpaid': {transaction['status']}"
            )
            raise ValueError(
                f"Transaksi tidak dapat dibatalkan: status {transaction['status']}"
            )

        # Panggil API Midtrans untuk membatalkan transaksi
        is_production = os.environ.get("MIDTRANS_ENV") == "production"
        url = (
            f"https://api.midtrans.com/v2/{order_id}/cancel"
            if is_production
            else f"https://api.sandbox.midtrans.com/v2/{order_id}/cancel"
        )
        server_key = os.environ.get("MIDTRANS_SERVER_KEY")
        auth_header = base64.b64encode(server_key.encode()).decode()
        headers = {
            "accept": "application/json",
            "Authorization": f"Basic {auth_header}",
        }

        # Gunakan requests.Session dengan retry
        session = requests.Session()
        retries = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        session.mount("https://", HTTPAdapter(max_retries=retries))
        response = session.post(url, headers=headers, timeout=10)
        session.close()

        # Periksa apakah pembatalan Midtrans berhasil
        if 200 <= response.status_code < 300:  # Sukses (200-299)
            logger.info(f"Transaksi {order_id} berhasil dibatalkan di Midtrans")
        else:
            response_json = response.json()
            logger.error(
                f"Gagal membatalkan transaksi di Midtrans untuk order_id {order_id}: {response_json.get('status_message', 'Unknown error')}"
            )
            raise Exception(
                f"Gagal membatalkan transaksi di Midtrans: {response_json.get('status_message', 'Unknown error')}"
            )

        # Perbarui status transaksi dan mobil dalam sesi transaksi MongoDB
        with db.client.start_session() as session:
            with session.start_transaction():
                expire_at = datetime.now(WITA_TZ)
                db.transaction.update_one(
                    {"order_id": order_id},
                    {"$set": {"expired": expire_at, "status": "canceled", "pesan": msg}},
                    session=session,
                )
                db.dataMobil.update_one(
                    {"id_mobil": transaction["id_mobil"]},
                    {
                        "$set": {
                            "status_transaksi": None,
                            "order_id": None,
                            "status": "Tersedia",
                        }
                    },
                    session=session,
                )
                logger.info(
                    f"Transaksi {order_id} berhasil dibatalkan, status_transaksi dan status di dataMobil direset ke None dan Tersedia"
                )

        return True
    except Exception as e:
        logger.error(f"Gagal membatalkan transaksi {order_id}: {str(e)}")
        raise