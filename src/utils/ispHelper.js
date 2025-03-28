function generateNomorInternet() {
    const date = new Date();
    const year = date.getFullYear(); // YYYY
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // MM
    const day = date.getDate().toString().padStart(2, '0'); // DD
    const randomNumber = Math.floor(100 + Math.random() * 900); // Selalu 3 digit (100-999)

    return `${year}${month}${day}${randomNumber}`;
}

// Ekspor fungsi agar bisa digunakan di seluruh aplikasi
module.exports = { generateNomorInternet };
